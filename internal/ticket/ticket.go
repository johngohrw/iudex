// Package ticket defines the iudex ticket state machine and derives ticket
// status by replaying the event log.
//
// The event log (package events) is the sole source of truth. Nothing in here
// holds persistent state; every value is computed from the events.
package ticket

import (
	"fmt"
	"strconv"

	"iudex/internal/events"
)

// State is a ticket lifecycle state.
type State string

const (
	StateNone           State = ""                 // never registered
	StateQueued         State = "queued"           // registered, awaiting activation
	StateActive         State = "active"           // worktree live, being implemented
	StatePendingQA      State = "pending-qa"       // awaiting agent QA
	StatePendingHumanQA State = "pending-human-qa" // QA-approved, awaiting human
	StateDone           State = "done"             // merged, archived, worktree removed
	StateFailed         State = "failed"           // hit qa_reject_limit; needs intervention
	StateRemoved        State = "removed"          // abandoned, archived, worktree removed
)

// Trigger is a command-driven transition cause, recorded on each event.
type Trigger string

const (
	TriggerQueue          Trigger = "queue"
	TriggerActivate       Trigger = "activate"
	TriggerFinish         Trigger = "finish"
	TriggerQAApprove      Trigger = "qa-approve"
	TriggerQAReject       Trigger = "qa-reject"
	TriggerHumanQAApprove Trigger = "human-qa-approve"
	TriggerHumanQAReject  Trigger = "human-qa-reject"
	TriggerRetry          Trigger = "retry"
	TriggerRemove         Trigger = "remove"
)

// transition is one deterministic rule in the state machine: a trigger is legal
// only from a state listed in from, and moves the ticket to to.
type transition struct {
	from []State
	to   State
}

// transitions is the deterministic core of the state machine: every trigger
// whose target depends only on the current state. The two state-sensitive
// triggers are handled directly in Apply — qa-reject (target depends on the
// reject counter and the configured limit) and remove (legal from any
// non-terminal state). Genesis (none --queue--> queued) is owned by the queue
// command, which validates absence rather than a transition.
var transitions = map[Trigger]transition{
	TriggerActivate:       {from: []State{StateQueued}, to: StateActive},
	TriggerFinish:         {from: []State{StateActive}, to: StatePendingQA},
	TriggerQAApprove:      {from: []State{StatePendingQA}, to: StatePendingHumanQA},
	TriggerHumanQAApprove: {from: []State{StatePendingHumanQA}, to: StateDone},
	TriggerHumanQAReject:  {from: []State{StatePendingHumanQA}, to: StateActive},
	TriggerRetry:          {from: []State{StateFailed}, to: StateActive},
}

// IllegalTransition reports a trigger that is not valid from a ticket's current
// state. Callers prepend the ticket id.
type IllegalTransition struct {
	From    State
	Trigger Trigger
}

func (e *IllegalTransition) Error() string {
	if e.From == StateNone {
		return fmt.Sprintf("cannot %s an unregistered ticket", e.Trigger)
	}
	return fmt.Sprintf("cannot %s a ticket in state %s", e.Trigger, e.From)
}

// Apply validates trigger t against the ticket's current state and returns the
// resulting state, or an *IllegalTransition. It is the single source of truth
// for which transitions are legal and where they lead; the surrounding side
// effects (worktrees, merges, archiving) and world-guards (dependencies,
// max_active, a clean repo) stay with the commands.
//
// qaRejectLimit is consulted only for qa-reject, where the target is active
// below the limit and failed once it is reached (a limit <= 0 means unlimited).
// It is ignored for every other trigger.
func Apply(s *Status, t Trigger, qaRejectLimit int) (State, error) {
	switch t {
	case TriggerRemove:
		if IsTerminal(s.State) {
			return "", &IllegalTransition{From: s.State, Trigger: t}
		}
		return StateRemoved, nil
	case TriggerQAReject:
		if s.State != StatePendingQA {
			return "", &IllegalTransition{From: s.State, Trigger: t}
		}
		count := s.QARejects + 1
		if qaRejectLimit > 0 && count >= qaRejectLimit {
			return StateFailed, nil
		}
		return StateActive, nil
	}
	if tr, ok := transitions[t]; ok {
		for _, f := range tr.from {
			if s.State == f {
				return tr.to, nil
			}
		}
	}
	return "", &IllegalTransition{From: s.State, Trigger: t}
}

// IsTerminal reports whether a state has no outgoing transitions.
func IsTerminal(s State) bool {
	return s == StateDone || s == StateRemoved
}

// HasWorktree reports whether a state implies a live worktree on disk.
func HasWorktree(s State) bool {
	switch s {
	case StateActive, StatePendingQA, StatePendingHumanQA, StateFailed:
		return true
	default:
		return false
	}
}

// Status is the derived current standing of a single ticket.
type Status struct {
	Ticket    string
	State     State
	Deps      []string // blocking deps registered at queue time
	QARejects int      // cumulative qa-reject count since the last activation/retry
}

// Derive replays the event log in order and returns the current status of every
// ticket that appears in it, keyed by ticket id.
//
// Replay rules:
//   - State is always the To of the most recent event for the ticket.
//   - Deps are recorded from the queue event (they are fixed at registration).
//   - QARejects counts qa-reject events and is reset to zero by retry, giving a
//     failed ticket a fresh budget. It is cumulative otherwise; human-qa reject
//     neither increments nor resets it.
func Derive(evs []events.Event) (map[string]*Status, error) {
	statuses := make(map[string]*Status)
	for _, ev := range evs {
		s := statuses[ev.Ticket]
		if s == nil {
			s = &Status{Ticket: ev.Ticket}
			statuses[ev.Ticket] = s
		}
		s.State = State(ev.To)
		switch Trigger(ev.Trigger) {
		case TriggerQueue:
			s.Deps = append([]string(nil), ev.Deps...)
		case TriggerQAReject:
			s.QARejects++
		case TriggerRetry:
			s.QARejects = 0
		}
	}
	return statuses, nil
}

// DepsReady reports whether every dependency of status is Done, plus the list
// of deps that are still blocking. A dep that is missing from the derived map or
// in any non-done state is considered blocking.
func DepsReady(status *Status, all map[string]*Status) (ready bool, blocking []string) {
	for _, dep := range status.Deps {
		if d := all[dep]; d == nil || d.State != StateDone {
			blocking = append(blocking, dep)
		}
	}
	return len(blocking) == 0, blocking
}

// MaxID returns the highest ticket number ever registered in the log, or 0 when
// none. Ticket ids never reuse, so this is the basis for the next id.
func MaxID(evs []events.Event) int {
	max := 0
	for _, ev := range evs {
		if n, ok := ParseID(ev.Ticket); ok && n > max {
			max = n
		}
	}
	return max
}

// ParseID extracts the positive number from a ticket id like "t5".
func ParseID(id string) (int, bool) {
	if len(id) < 2 || id[0] != 't' {
		return 0, false
	}
	n, err := strconv.Atoi(id[1:])
	if err != nil || n <= 0 {
		return 0, false
	}
	return n, true
}

// FormatID returns the canonical ticket id for a number, e.g. 5 -> "t5".
func FormatID(n int) string {
	return fmt.Sprintf("t%d", n)
}
