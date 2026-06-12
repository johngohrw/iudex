// Package archive preserves completed and rejected ticket context before cleanup.
//
// On merge:   archive/<ticket-id>/
// On reject:  archive/<ticket-id>_rejected/  (suffixed; collisions become _rejected_2, etc.)
//
// Each archive contains: brief.md, log.md, review.md, diff.patch, meta.json
package archive

import (
	"encoding/json"
	"fmt"
	"io"
	"os"
	"path/filepath"
	"time"

	"iudex/internal/config"
	"iudex/internal/events"
	"iudex/internal/git"
)

// Meta is written as meta.json in each archive directory.
type Meta struct {
	Ticket          string        `json:"ticket"`
	Outcome         string        `json:"outcome"`
	ArchivedAt      string        `json:"archived_at"`
	MergeCommit     string        `json:"merge_commit,omitempty"`
	RejectionReason string        `json:"rejection_reason,omitempty"`
	Events          []events.Event `json:"events"`
}

// Archive copies .task/ contents, the diff, and a metadata file to the archive
// directory before the worktree is removed. Returns the archive path.
func Archive(workspace, ticket, outcome, mergeCommit, rejectionReason string) (string, error) {
	baseName := ticket
	if outcome == "rejected" {
		baseName = ticket + "_rejected"
	}
	dest := nextAvailablePath(config.ArchiveDir(workspace), baseName)
	if err := os.MkdirAll(dest, 0o755); err != nil {
		return "", fmt.Errorf("create archive dir: %w", err)
	}

	taskDir := config.TaskDir(workspace, ticket)

	// Copy .task/ files — skip missing ones gracefully
	for _, fname := range []string{"brief.md", "log.md", "review.md"} {
		src := filepath.Join(taskDir, fname)
		if _, err := os.Stat(src); err != nil {
			continue
		}
		if err := copyFile(src, filepath.Join(dest, fname)); err != nil {
			return "", fmt.Errorf("archive %s: %w", fname, err)
		}
	}

	// Save implementation diff (excludes .task/)
	if diff, err := git.GetDiff(workspace, ticket); err == nil {
		os.WriteFile(filepath.Join(dest, "diff.patch"), []byte(diff), 0o644)
	}

	// Save metadata
	evs, _ := events.GetTicketEvents(workspace, ticket)
	meta := Meta{
		Ticket:          ticket,
		Outcome:         outcome,
		ArchivedAt:      time.Now().UTC().Format(time.RFC3339),
		MergeCommit:     mergeCommit,
		RejectionReason: rejectionReason,
		Events:          evs,
	}
	if data, err := json.MarshalIndent(meta, "", "  "); err == nil {
		os.WriteFile(filepath.Join(dest, "meta.json"), data, 0o644)
	}

	return dest, nil
}

// nextAvailablePath returns base/name if unused, otherwise base/name_2, base/name_3, …
func nextAvailablePath(base, name string) string {
	candidate := filepath.Join(base, name)
	if _, err := os.Stat(candidate); os.IsNotExist(err) {
		return candidate
	}
	for n := 2; ; n++ {
		candidate = filepath.Join(base, fmt.Sprintf("%s_%d", name, n))
		if _, err := os.Stat(candidate); os.IsNotExist(err) {
			return candidate
		}
	}
}

func copyFile(src, dst string) error {
	in, err := os.Open(src)
	if err != nil {
		return err
	}
	defer in.Close()
	out, err := os.Create(dst)
	if err != nil {
		return err
	}
	defer out.Close()
	_, err = io.Copy(out, in)
	return err
}
