package cmd

import (
	"fmt"
	"io/fs"
	"os"
	"path/filepath"
	"strings"

	"github.com/spf13/cobra"

	"iudex/internal/git"
	"iudex/internal/workspace"
)

// newInitCmd scaffolds the current directory into an iudex workspace: ensures a
// git repo + initial commit if needed, records the current branch as
// main_branch, creates .iudex/ from embedded templates, and gitignores .iudex/.
func newInitCmd() *cobra.Command {
	return &cobra.Command{
		Use:   "init",
		Short: "Scaffold the current directory into an iudex workspace",
		Args:  cobra.NoArgs,
		RunE:  runInit,
	}
}

func runInit(cmd *cobra.Command, _ []string) error {
	out := cmd.OutOrStdout()

	root, err := os.Getwd()
	if err != nil {
		return err
	}

	// Refuse to clobber an existing workspace.
	if _, err := os.Stat(workspace.ConfigFile(root)); err == nil {
		return fmt.Errorf("already an iudex workspace (%s exists)", filepath.Join(workspace.Dir, "config.yml"))
	}

	// Ensure a git repository exists.
	if !git.IsRepo(root) {
		fmt.Fprintln(out, "  initializing git repository…")
		if err := git.Init(root); err != nil {
			return fmt.Errorf("git init: %w", err)
		}
	}

	// Gitignore .iudex/ before any commit so workspace state never enters history.
	addedIgnore, err := ensureGitignore(root, workspace.Dir+"/")
	if err != nil {
		return fmt.Errorf("update .gitignore: %w", err)
	}

	// Worktrees need a base commit on the canonical branch. Create one only when
	// the repo has no history yet, leaving any existing history untouched.
	hasCommits, err := git.HasCommits(root)
	if err != nil {
		return err
	}
	if !hasCommits {
		fmt.Fprintln(out, "  creating initial commit…")
		if err := git.CommitAll(root, "initial commit"); err != nil {
			return fmt.Errorf("initial commit: %w", err)
		}
	}

	// The current branch becomes the canonical merge target.
	branch, err := git.CurrentBranch(root)
	if err != nil {
		return fmt.Errorf("determine current branch (is HEAD detached?): %w", err)
	}

	if err := scaffoldWorkspace(root, branch); err != nil {
		return err
	}

	fmt.Fprintf(out, "\n✓ iudex workspace ready (main_branch: %s)\n", branch)
	if addedIgnore && hasCommits {
		fmt.Fprintf(out, "  note: added %s/ to .gitignore — commit it when ready\n", workspace.Dir)
	}
	fmt.Fprintf(out, "  Author a ticket:   vim %s\n", filepath.Join(workspace.Dir, "queue", "t$(iudex next-ticket-id).md"))
	fmt.Fprintln(out, "  Then register it:  iudex queue t<id> --deps <ids>")
	return nil
}

// ensureGitignore appends entry to <root>/.gitignore if not already present.
// Reports whether it added the entry.
func ensureGitignore(root, entry string) (bool, error) {
	p := filepath.Join(root, ".gitignore")
	data, err := os.ReadFile(p)
	if err != nil && !os.IsNotExist(err) {
		return false, err
	}
	want := strings.TrimRight(entry, "/")
	for _, line := range strings.Split(string(data), "\n") {
		s := strings.TrimRight(strings.TrimSpace(line), "/")
		if s == want {
			return false, nil
		}
	}
	f, err := os.OpenFile(p, os.O_APPEND|os.O_WRONLY|os.O_CREATE, 0o644)
	if err != nil {
		return false, err
	}
	defer f.Close()
	prefix := ""
	if len(data) > 0 && !strings.HasSuffix(string(data), "\n") {
		prefix = "\n"
	}
	if _, err := fmt.Fprintf(f, "%s# iudex workspace state\n%s\n", prefix, entry); err != nil {
		return false, err
	}
	return true, nil
}

// scaffoldWorkspace extracts the embedded .iudex/ templates into root, patches
// config.yml with the detected branch, creates the runtime directories, and
// writes an empty events log.
func scaffoldWorkspace(root, branch string) error {
	const base = "templates/dot_iudex"
	err := fs.WalkDir(templatesFS, base, func(path string, d fs.DirEntry, err error) error {
		if err != nil {
			return err
		}
		rel, err := filepath.Rel(base, path)
		if err != nil {
			return err
		}
		dest := filepath.Join(workspace.IudexDir(root), rel)
		if d.IsDir() {
			return os.MkdirAll(dest, 0o755)
		}
		data, err := templatesFS.ReadFile(path)
		if err != nil {
			return err
		}
		if rel == "config.yml" && branch != "main" {
			data = []byte(strings.Replace(string(data), "main_branch: main", "main_branch: "+branch, 1))
		}
		return os.WriteFile(dest, data, 0o644)
	})
	if err != nil {
		return fmt.Errorf("scaffold templates: %w", err)
	}

	for _, d := range []string{"queue", "archive", "worktrees"} {
		if err := os.MkdirAll(filepath.Join(workspace.IudexDir(root), d), 0o755); err != nil {
			return err
		}
	}
	if err := os.WriteFile(workspace.EventsFile(root), nil, 0o644); err != nil {
		return err
	}
	return nil
}
