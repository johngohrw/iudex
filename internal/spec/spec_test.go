package spec

import (
	"strings"
	"testing"
)

const sample = `# Checkout

How a shopper pays.

## Payment

### REQ-1: Card payment via Stripe
Users complete purchase with a saved or new card.

## REQ-2: Wallets
> status: active
One-tap wallet checkout.

#### REQ-3: Promo codes
One code per order.

## Confirmation

### REQ-5: Gift receipts
> status: parked
> note: revisit post-launch
Hide prices on a printable receipt.
`

func find(p PRD, id string) *Requirement {
	for i := range p.Requirements {
		if p.Requirements[i].ID == id {
			return &p.Requirements[i]
		}
	}
	return nil
}

func TestParseTitleAndRequirements(t *testing.T) {
	p := Parse("checkout.md", []byte(sample))
	if p.File != "checkout.md" {
		t.Errorf("File = %q", p.File)
	}
	if p.Title != "Checkout" {
		t.Errorf("Title = %q, want Checkout", p.Title)
	}
	// Level-agnostic: ###, ##, and #### headings all count as requirements; the
	// "## Payment"/"## Confirmation" section headings do not.
	want := []string{"REQ-1", "REQ-2", "REQ-3", "REQ-5"}
	if len(p.Requirements) != len(want) {
		t.Fatalf("got %d requirements, want %d: %+v", len(p.Requirements), len(want), p.Requirements)
	}
	for i, id := range want {
		if p.Requirements[i].ID != id {
			t.Errorf("requirement %d = %q, want %q", i, p.Requirements[i].ID, id)
		}
	}
}

func TestParseStatusAndBody(t *testing.T) {
	p := Parse("checkout.md", []byte(sample))

	if r := find(p, "REQ-1"); r == nil || r.Status != StatusActive {
		t.Errorf("REQ-1 status = %v, want active (default)", r)
	}
	if r := find(p, "REQ-1"); r == nil || r.Body != "Users complete purchase with a saved or new card." {
		t.Errorf("REQ-1 body = %q", r.Body)
	}
	if r := find(p, "REQ-1"); r == nil || r.Title != "Card payment via Stripe" {
		t.Errorf("REQ-1 title = %q", r.Title)
	}

	r5 := find(p, "REQ-5")
	if r5 == nil || r5.Status != StatusParked {
		t.Errorf("REQ-5 status = %v, want parked", r5)
	}
	// The `> note:` metadata line is consumed (ignored), not folded into the body.
	if r5 != nil && r5.Body != "Hide prices on a printable receipt." {
		t.Errorf("REQ-5 body = %q", r5.Body)
	}
}

func TestParseGracefulNoRequirements(t *testing.T) {
	p := Parse("legacy.md", []byte("# Legacy PRD\n\nJust prose, no REQ headings.\n"))
	if p.Title != "Legacy PRD" {
		t.Errorf("Title = %q", p.Title)
	}
	if len(p.Requirements) != 0 {
		t.Errorf("want 0 requirements, got %d", len(p.Requirements))
	}
	// Must be non-nil so JSON encodes [] not null.
	if p.Requirements == nil {
		t.Error("Requirements is nil; want empty slice")
	}
}

func TestLint(t *testing.T) {
	src := `# P

### REQ-1: Good
### REQ-1: Duplicate
### REQ-2
### REQ-3: Bad status
> status: nope
### REQ-?: Draft
`
	issues := Lint([]byte(src))
	var msgs []string
	for _, is := range issues {
		if is.Severity != SeverityWarn {
			t.Errorf("severity = %q, want warn (warn-first)", is.Severity)
		}
		msgs = append(msgs, is.Message)
	}
	joined := strings.Join(msgs, "\n")
	for _, want := range []string{"duplicate REQ-1", "malformed requirement heading", "unknown status", "unresolved placeholder"} {
		if !strings.Contains(joined, want) {
			t.Errorf("lint missing %q in:\n%s", want, joined)
		}
	}
}

func TestLintClean(t *testing.T) {
	if issues := Lint([]byte(sample)); len(issues) != 0 {
		t.Errorf("want no issues on clean sample, got %+v", issues)
	}
}

func TestFixAssignsAppendOnly(t *testing.T) {
	src := "# P\n\n### REQ-1: One\n### REQ-?: Two\n### REQ-?: Three\n"
	fixed, changed := Fix([]byte(src))
	if !changed {
		t.Fatal("Fix reported no change")
	}
	out := string(fixed)
	// Placeholders get max-in-file (1) + 1, then +1 — never reusing existing ids.
	if !strings.Contains(out, "### REQ-2: Two") {
		t.Errorf("want REQ-2 assigned, got:\n%s", out)
	}
	if !strings.Contains(out, "### REQ-3: Three") {
		t.Errorf("want REQ-3 assigned, got:\n%s", out)
	}
	if strings.Contains(out, "REQ-?") {
		t.Errorf("placeholder left unresolved:\n%s", out)
	}
}

func TestFixNoOp(t *testing.T) {
	src := "# P\n\n### REQ-1: One\n"
	fixed, changed := Fix([]byte(src))
	if changed {
		t.Errorf("Fix changed a file with no placeholders:\n%s", fixed)
	}
}
