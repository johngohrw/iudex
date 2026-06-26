package ticket

import (
	"reflect"
	"testing"

	"iudex/internal/events"
)

// ev is a terse constructor for a transition event.
func ev(ticket, from, to, trigger string, deps ...string) events.Event {
	return events.Event{Ticket: ticket, From: from, To: to, Trigger: trigger, Deps: deps}
}

func derive(t *testing.T, evs []events.Event) map[string]*Status {
	t.Helper()
	st, err := Derive(evs)
	if err != nil {
		t.Fatalf("Derive: %v", err)
	}
	return st
}

func wantStatus(t *testing.T, s *Status, state State, rejects int) {
	t.Helper()
	if s == nil {
		t.Fatalf("status is nil")
	}
	if s.State != state {
		t.Errorf("state = %q, want %q", s.State, state)
	}
	if s.QARejects != rejects {
		t.Errorf("qaRejects = %d, want %d", s.QARejects, rejects)
	}
}

func TestApply(t *testing.T) {
	cases := []struct {
		name    string
		from    State
		rejects int
		trigger Trigger
		limit   int
		want    State
		wantErr bool
	}{
		// the deterministic happy path
		{"activate queued", StateQueued, 0, TriggerActivate, 0, StateActive, false},
		{"finish active", StateActive, 0, TriggerFinish, 0, StatePendingQA, false},
		{"qa-approve", StatePendingQA, 0, TriggerQAApprove, 0, StatePendingHumanQA, false},
		{"human-qa-approve", StatePendingHumanQA, 0, TriggerHumanQAApprove, 0, StateDone, false},
		{"human-qa-reject", StatePendingHumanQA, 0, TriggerHumanQAReject, 0, StateActive, false},
		{"retry failed", StateFailed, 0, TriggerRetry, 0, StateActive, false},

		// qa-reject ladder: below the limit -> active, at it -> failed
		{"reject below limit", StatePendingQA, 0, TriggerQAReject, 3, StateActive, false},
		{"reject one below limit", StatePendingQA, 1, TriggerQAReject, 3, StateActive, false},
		{"reject reaches limit", StatePendingQA, 2, TriggerQAReject, 3, StateFailed, false},
		{"reject past limit", StatePendingQA, 5, TriggerQAReject, 3, StateFailed, false},
		{"reject unlimited (0)", StatePendingQA, 99, TriggerQAReject, 0, StateActive, false},
		{"reject unlimited (neg)", StatePendingQA, 99, TriggerQAReject, -1, StateActive, false},
		{"reject limit 1 fails first", StatePendingQA, 0, TriggerQAReject, 1, StateFailed, false},

		// remove: legal from any non-terminal state, illegal from terminal
		{"remove queued", StateQueued, 0, TriggerRemove, 0, StateRemoved, false},
		{"remove active", StateActive, 0, TriggerRemove, 0, StateRemoved, false},
		{"remove pending-human-qa", StatePendingHumanQA, 0, TriggerRemove, 0, StateRemoved, false},
		{"remove failed", StateFailed, 0, TriggerRemove, 0, StateRemoved, false},
		{"remove done illegal", StateDone, 0, TriggerRemove, 0, "", true},
		{"remove removed illegal", StateRemoved, 0, TriggerRemove, 0, "", true},

		// illegal: right trigger, wrong state
		{"activate active", StateActive, 0, TriggerActivate, 0, "", true},
		{"finish queued", StateQueued, 0, TriggerFinish, 0, "", true},
		{"qa-approve active", StateActive, 0, TriggerQAApprove, 0, "", true},
		{"qa-reject active", StateActive, 0, TriggerQAReject, 3, "", true},
		{"human-qa-approve active", StateActive, 0, TriggerHumanQAApprove, 0, "", true},
		{"retry active", StateActive, 0, TriggerRetry, 0, "", true},
		{"retry done", StateDone, 0, TriggerRetry, 0, "", true},

		// illegal: unregistered ticket (state none) accepts no trigger here
		{"activate none", StateNone, 0, TriggerActivate, 0, "", true},
		{"finish none", StateNone, 0, TriggerFinish, 0, "", true},
	}
	for _, c := range cases {
		t.Run(c.name, func(t *testing.T) {
			got, err := Apply(&Status{Ticket: "t1", State: c.from, QARejects: c.rejects}, c.trigger, c.limit)
			if c.wantErr {
				if err == nil {
					t.Fatalf("Apply(%s, %s) = %q, want error", c.from, c.trigger, got)
				}
				if _, ok := err.(*IllegalTransition); !ok {
					t.Errorf("error is %T, want *IllegalTransition", err)
				}
				return
			}
			if err != nil {
				t.Fatalf("Apply(%s, %s): unexpected error %v", c.from, c.trigger, err)
			}
			if got != c.want {
				t.Errorf("Apply(%s, %s) = %q, want %q", c.from, c.trigger, got, c.want)
			}
		})
	}
}

func TestDeriveHappyPath(t *testing.T) {
	st := derive(t, []events.Event{
		ev("t1", "", "queued", "queue"),
		ev("t1", "queued", "active", "activate"),
		ev("t1", "active", "pending-qa", "finish"),
		ev("t1", "pending-qa", "pending-human-qa", "qa-approve"),
		ev("t1", "pending-human-qa", "done", "human-qa-approve"),
	})
	wantStatus(t, st["t1"], StateDone, 0)
}

func TestDeriveCounterFailsAtLimitThenRetryResets(t *testing.T) {
	evs := []events.Event{
		ev("t1", "", "queued", "queue"),
		ev("t1", "queued", "active", "activate"),
		ev("t1", "active", "pending-qa", "finish"),
		ev("t1", "pending-qa", "active", "qa-reject"), // 1
		ev("t1", "active", "pending-qa", "finish"),
		ev("t1", "pending-qa", "active", "qa-reject"), // 2
		ev("t1", "active", "pending-qa", "finish"),
		ev("t1", "pending-qa", "failed", "qa-reject"), // 3 -> failed
	}
	st := derive(t, evs)
	wantStatus(t, st["t1"], StateFailed, 3)

	// retry resets the counter and returns to active.
	evs = append(evs, ev("t1", "failed", "active", "retry"))
	st = derive(t, evs)
	wantStatus(t, st["t1"], StateActive, 0)
}

func TestDeriveHumanQARejectNeitherCountsNorResets(t *testing.T) {
	st := derive(t, []events.Event{
		ev("t1", "", "queued", "queue"),
		ev("t1", "queued", "active", "activate"),
		ev("t1", "active", "pending-qa", "finish"),
		ev("t1", "pending-qa", "active", "qa-reject"), // counter = 1
		ev("t1", "active", "pending-qa", "finish"),
		ev("t1", "pending-qa", "pending-human-qa", "qa-approve"),
		ev("t1", "pending-human-qa", "active", "human-qa-reject"), // unchanged
	})
	wantStatus(t, st["t1"], StateActive, 1)
}

func TestDeriveCapturesDepsFromQueueEvent(t *testing.T) {
	st := derive(t, []events.Event{
		ev("t1", "", "queued", "queue"),
		ev("t2", "", "queued", "queue", "t1", "t3"),
	})
	if got := st["t2"].Deps; !reflect.DeepEqual(got, []string{"t1", "t3"}) {
		t.Errorf("t2 deps = %v, want [t1 t3]", got)
	}
	if len(st["t1"].Deps) != 0 {
		t.Errorf("t1 deps = %v, want none", st["t1"].Deps)
	}
}

func TestDepsReady(t *testing.T) {
	all := map[string]*Status{
		"t1": {Ticket: "t1", State: StateDone},
		"t2": {Ticket: "t2", State: StateActive},
	}
	cases := []struct {
		name     string
		deps     []string
		ready    bool
		blocking []string
	}{
		{"all done", []string{"t1"}, true, nil},
		{"one not done", []string{"t1", "t2"}, false, []string{"t2"}},
		{"missing dep", []string{"t9"}, false, []string{"t9"}},
		{"no deps", nil, true, nil},
	}
	for _, c := range cases {
		t.Run(c.name, func(t *testing.T) {
			ready, blocking := DepsReady(&Status{Deps: c.deps}, all)
			if ready != c.ready {
				t.Errorf("ready = %v, want %v", ready, c.ready)
			}
			if !reflect.DeepEqual(blocking, c.blocking) {
				t.Errorf("blocking = %v, want %v", blocking, c.blocking)
			}
		})
	}
}

func TestMaxID(t *testing.T) {
	if got := MaxID(nil); got != 0 {
		t.Errorf("MaxID(nil) = %d, want 0", got)
	}
	got := MaxID([]events.Event{
		ev("t1", "", "queued", "queue"),
		ev("t10", "", "queued", "queue"),
		ev("t3", "", "queued", "queue"),
	})
	if got != 10 {
		t.Errorf("MaxID = %d, want 10", got)
	}
}

func TestParseID(t *testing.T) {
	cases := map[string]struct {
		n  int
		ok bool
	}{
		"t1":     {1, true},
		"t42":    {42, true},
		"t0":     {0, false},
		"t":      {0, false},
		"x5":     {0, false},
		"ticket": {0, false},
		"t-1":    {0, false},
	}
	for in, want := range cases {
		n, ok := ParseID(in)
		if n != want.n || ok != want.ok {
			t.Errorf("ParseID(%q) = (%d, %v), want (%d, %v)", in, n, ok, want.n, want.ok)
		}
	}
}
