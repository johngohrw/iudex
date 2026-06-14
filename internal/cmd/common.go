package cmd

import (
	"fmt"
	"path/filepath"

	"iudex/internal/events"
	"iudex/internal/ticket"
	"iudex/internal/workspace"
)

// wsContext bundles the resolved workspace, its config, and the state derived
// from its event log, which most commands need together.
type wsContext struct {
	Root     string
	Config   *workspace.Config
	Events   []events.Event
	Statuses map[string]*ticket.Status
}

// loadContext finds the workspace from the current directory, loads its config,
// reads its event log, and derives ticket statuses.
func loadContext() (*wsContext, error) {
	root, err := workspace.Find("")
	if err != nil {
		return nil, err
	}
	cfg, err := workspace.LoadConfig(root)
	if err != nil {
		return nil, err
	}
	evs, err := events.ReadAll(root)
	if err != nil {
		return nil, err
	}
	statuses, err := ticket.Derive(evs)
	if err != nil {
		return nil, err
	}
	return &wsContext{Root: root, Config: cfg, Events: evs, Statuses: statuses}, nil
}

// spawnCommand builds a ready-to-paste agent command that drops the user into a
// ticket's worktree with the given prompt template. iudex never runs it.
func spawnCommand(root string, cfg *workspace.Config, id, promptFile string) string {
	wt := workspace.Worktree(root, id)
	prompt := filepath.Join(workspace.PromptsDir(root), promptFile)
	return fmt.Sprintf(`cd %s && %s "$(cat %s)"`, wt, cfg.AgentCommand, prompt)
}
