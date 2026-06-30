package main

import (
	"encoding/json"
	"os"
	"path/filepath"
	"strings"
	"testing"
)

// jsonSpecOut mirrors the `iudex spec --json` contract (the GUI's read path).
type jsonSpecOut struct {
	PRDs []struct {
		File         string `json:"file"`
		Title        string `json:"title"`
		Requirements []struct {
			ID     string `json:"id"`
			Title  string `json:"title"`
			Status string `json:"status"`
			Body   string `json:"body"`
		} `json:"requirements"`
	} `json:"prds"`
}

func writePRD(t *testing.T, ws, name, content string) {
	t.Helper()
	dir := filepath.Join(ws, ".context", "prd")
	if err := os.MkdirAll(dir, 0o755); err != nil {
		t.Fatal(err)
	}
	if err := os.WriteFile(filepath.Join(dir, name), []byte(content), 0o644); err != nil {
		t.Fatal(err)
	}
}

func TestSpecJSON(t *testing.T) {
	ws := newWorkspace(t)
	writePRD(t, ws, "checkout.md", `# Checkout

## Payment

### REQ-1: Card payment
Pay with a card.

### REQ-3: Gift receipts
> status: parked
Hide prices.
`)

	out := mustRun(t, ws, "spec", "--json")
	var got jsonSpecOut
	if err := json.Unmarshal([]byte(out), &got); err != nil {
		t.Fatalf("invalid JSON: %v\n%s", err, out)
	}
	if len(got.PRDs) != 1 || got.PRDs[0].File != "checkout.md" || got.PRDs[0].Title != "Checkout" {
		t.Fatalf("unexpected prds: %+v", got.PRDs)
	}
	reqs := got.PRDs[0].Requirements
	if len(reqs) != 2 {
		t.Fatalf("got %d requirements, want 2: %+v", len(reqs), reqs)
	}
	if reqs[0].ID != "REQ-1" || reqs[0].Status != "active" || reqs[0].Title != "Card payment" {
		t.Errorf("REQ-1 = %+v", reqs[0])
	}
	if reqs[1].ID != "REQ-3" || reqs[1].Status != "parked" {
		t.Errorf("REQ-3 = %+v", reqs[1])
	}
}

func TestSpecJSONEmptyWhenNoPRDs(t *testing.T) {
	ws := newWorkspace(t)
	out := mustRun(t, ws, "spec", "--json")
	// No .context/prd at all must still produce a valid empty payload, not an error.
	if !strings.Contains(out, `"prds": []`) {
		t.Errorf("want empty prds array, got:\n%s", out)
	}
}

func TestSpecLintWarnsButSucceeds(t *testing.T) {
	ws := newWorkspace(t)
	writePRD(t, ws, "dupes.md", "# P\n\n### REQ-1: One\n### REQ-1: Two\n")
	// Warn-first: a duplicate id is reported but the command still exits 0.
	out := mustRun(t, ws, "spec", "lint", "dupes.md")
	if !strings.Contains(out, "duplicate REQ-1") {
		t.Errorf("want duplicate warning, got:\n%s", out)
	}
}

func TestSpecLintFixAssignsIDs(t *testing.T) {
	ws := newWorkspace(t)
	writePRD(t, ws, "draft.md", "# P\n\n### REQ-1: One\n### REQ-?: Two\n")
	mustRun(t, ws, "spec", "lint", "draft.md", "--fix")

	data, err := os.ReadFile(filepath.Join(ws, ".context", "prd", "draft.md"))
	if err != nil {
		t.Fatal(err)
	}
	got := string(data)
	if !strings.Contains(got, "### REQ-2: Two") {
		t.Errorf("placeholder not assigned REQ-2:\n%s", got)
	}
	if strings.Contains(got, "REQ-?") {
		t.Errorf("placeholder left:\n%s", got)
	}
}
