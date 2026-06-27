package cmd

import (
	"fmt"

	"github.com/spf13/cobra"

	"iudex/internal/events"
	"iudex/internal/ticket"
)

// newRetryCmd moves a failed ticket back to active and resets its QA-reject
// counter for a fresh attempt in the preserved worktree.
func newRetryCmd() *cobra.Command {
	return &cobra.Command{
		Use:   "retry <ticket-id>",
		Short: "Retry a failed ticket: failed -> active, reset reject counter",
		Args:  cobra.ExactArgs(1),
		RunE:  runRetry,
	}
}

func runRetry(cmd *cobra.Command, args []string) error {
	ctx, err := loadContext()
	if err != nil {
		return err
	}
	id := args[0]

	s, next, err := ctx.transition(id, ticket.TriggerRetry)
	if err != nil {
		return err
	}

	if _, err := events.Append(ctx.Root, events.Event{
		Ticket:  id,
		From:    string(s.State),
		To:      string(next),
		Trigger: string(ticket.TriggerRetry),
	}); err != nil {
		return err
	}

	out := cmd.OutOrStdout()
	fmt.Fprintf(out, "↻ %s reset for another attempt (active); QA rejection counter cleared\n", id)
	fmt.Fprintln(out, "  spawn the implementation agent:")
	fprintSpawnHint(out, ctx.Root, ctx.GlobalConfig, id, "impl.md")
	return nil
}
