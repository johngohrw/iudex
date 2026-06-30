package cmd

import (
	"encoding/json"
	"errors"
	"fmt"
	"os"
	"path/filepath"
	"strings"

	"github.com/spf13/cobra"

	"iudex/internal/spec"
	"iudex/internal/workspace"
)

// newSpecCmd inspects the PRD requirements parsed from .context/prd. With --json
// it emits the machine-readable read path the GUI's Specifications view binds to
// (the spec analogue of `status --json`): all PRDs, structure only, no coverage.
// The `lint` subcommand validates the format and (with --fix) mints ids. Parsing
// is single-sourced here so the GUI and the authoring skills can't drift from it.
func newSpecCmd() *cobra.Command {
	cmd := &cobra.Command{
		Use:   "spec",
		Short: "Inspect PRD requirements parsed from .context/prd",
		Args:  cobra.NoArgs,
		RunE:  runSpec,
	}
	cmd.Flags().Bool("json", false, "emit machine-readable JSON (all PRDs, structure only)")
	cmd.AddCommand(newSpecLintCmd())
	return cmd
}

// jsonSpec is the machine-readable shape emitted by `iudex spec --json`. It is
// the stable contract the GUI reads; fields may be added but existing ones
// should not change meaning. The PRD/Requirement JSON tags live in package spec.
type jsonSpec struct {
	PRDs []spec.PRD `json:"prds"`
}

func runSpec(cmd *cobra.Command, _ []string) error {
	asJSON, err := cmd.Flags().GetBool("json")
	if err != nil {
		return err
	}
	root, err := workspace.Find("")
	if err != nil {
		return err
	}
	prds, err := spec.ParseAll(workspace.PRDDir(root))
	if err != nil {
		return err
	}

	if asJSON {
		enc := json.NewEncoder(cmd.OutOrStdout())
		enc.SetIndent("", "  ")
		return enc.Encode(jsonSpec{PRDs: prds})
	}

	out := cmd.OutOrStdout()
	if len(prds) == 0 {
		fmt.Fprintln(out, "(no PRDs in .context/prd)")
		return nil
	}
	for _, p := range prds {
		title := p.Title
		if title == "" {
			title = "(untitled)"
		}
		fmt.Fprintf(out, "%s — %s\n", p.File, title)
		if len(p.Requirements) == 0 {
			fmt.Fprintln(out, "  (no requirements)")
		}
		for _, r := range p.Requirements {
			fmt.Fprintf(out, "  %-7s %-12s %s\n", r.ID, r.Status, r.Title)
		}
	}
	return nil
}

// newSpecLintCmd validates PRD requirement format. It is warn-first: it reports
// issues but exits 0, so a malformed PRD never wedges the to-issues flow during
// adoption (the blocking cutover is future work). With --fix it assigns ids to
// REQ-? placeholders before linting.
func newSpecLintCmd() *cobra.Command {
	cmd := &cobra.Command{
		Use:   "lint [file]",
		Short: "Validate PRD requirement format (warns; --fix assigns missing ids)",
		Args:  cobra.MaximumNArgs(1),
		RunE:  runSpecLint,
	}
	cmd.Flags().Bool("fix", false, "assign ids to REQ-? placeholders (append-only)")
	return cmd
}

func runSpecLint(cmd *cobra.Command, args []string) error {
	fix, err := cmd.Flags().GetBool("fix")
	if err != nil {
		return err
	}
	root, err := workspace.Find("")
	if err != nil {
		return err
	}
	dir := workspace.PRDDir(root)

	files, err := lintTargets(dir, args)
	if err != nil {
		return err
	}

	out := cmd.OutOrStdout()
	total := 0
	for _, f := range files {
		data, err := os.ReadFile(f)
		if err != nil {
			return err
		}
		if fix {
			if fixed, changed := spec.Fix(data); changed {
				if err := os.WriteFile(f, fixed, 0o644); err != nil {
					return err
				}
				data = fixed
				fmt.Fprintf(out, "%s: assigned ids to REQ-? placeholders\n", filepath.Base(f))
			}
		}
		for _, is := range spec.Lint(data) {
			fmt.Fprintf(out, "%s:%d: %s: %s\n", filepath.Base(f), is.Line, is.Severity, is.Message)
			total++
		}
	}
	if total == 0 {
		fmt.Fprintln(out, "ok — no issues")
	}
	return nil // warn-first: findings never set a non-zero exit
}

// lintTargets resolves the files to lint: the single named file (taken as given
// if it exists, else as a basename under the PRD dir), or every top-level *.md
// in the PRD dir. A missing PRD dir yields no targets, not an error.
func lintTargets(dir string, args []string) ([]string, error) {
	if len(args) == 1 {
		arg := args[0]
		if _, err := os.Stat(arg); err == nil {
			return []string{arg}, nil
		}
		return []string{filepath.Join(dir, arg)}, nil
	}
	entries, err := os.ReadDir(dir)
	if errors.Is(err, os.ErrNotExist) {
		return nil, nil
	}
	if err != nil {
		return nil, err
	}
	var files []string
	for _, e := range entries {
		if e.IsDir() || !strings.HasSuffix(e.Name(), ".md") {
			continue
		}
		files = append(files, filepath.Join(dir, e.Name()))
	}
	return files, nil
}
