package cmd

import (
	"fmt"

	"github.com/spf13/cobra"

	"iudex/internal/workspace"
)

// newAgentCommandCmd prints the agent command resolved for a role from the
// global pool (~/.iudex/config.yml). It is the single source of the role->command
// rule (the same resolution `spawn` uses internally), exposed for callers that
// build their own spawns for non-ticket roles — e.g. the GUI's resolve/idea
// agents. The pool is machine-level, so this runs without a workspace.
//
// The role is an opaque config key: this command looks it up in agent_roles and
// the pool and knows nothing about what any particular role means or does. Like
// the ticket spawn path, it errors rather than emit an empty command, so callers
// never launch a half-built `cd … && '<prompt>'` line.
func newAgentCommandCmd() *cobra.Command {
	return &cobra.Command{
		Use:   "agent-command <role>",
		Short: "Print the configured agent command for a role",
		Args:  cobra.ExactArgs(1),
		RunE:  runAgentCommand,
	}
}

func runAgentCommand(cmd *cobra.Command, args []string) error {
	role := args[0]
	global, err := workspace.LoadGlobalConfig()
	if err != nil {
		return err
	}
	command := global.AgentCommandForRole(role)
	if command == "" {
		return fmt.Errorf("no agent command configured for role %q — add an entry under agent_commands in ~/.iudex/config.yml", role)
	}
	fmt.Fprintln(cmd.OutOrStdout(), command)
	return nil
}
