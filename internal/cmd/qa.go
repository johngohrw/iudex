package cmd

import (
	"fmt"
	"os"
	"path/filepath"

	"github.com/spf13/cobra"

	"iudex/internal/events"
	"iudex/internal/ticket"
	"iudex/internal/workspace"
)

// newQACmd is the `iudex qa` command group for the agent QA phase. The ticket is
// inferred from the current worktree when omitted.
func newQACmd() *cobra.Command {
	qa := &cobra.Command{
		Use:   "qa",
		Short: "Agent QA actions (approve, reject)",
	}
	qa.AddCommand(
		&cobra.Command{
			Use:   "approve [ticket-id]",
			Short: "Approve QA: pending-qa -> pending-human-qa",
			Args:  cobra.MaximumNArgs(1),
			RunE:  runQAApprove,
		},
		&cobra.Command{
			Use:   "reject [ticket-id]",
			Short: "Reject QA: pending-qa -> active (or -> failed at the limit)",
			Args:  cobra.MaximumNArgs(1),
			RunE:  runQAReject,
		},
	)
	return qa
}

// qaTransition resolves the ticket from args and validates trigger t (qa-approve
// or qa-reject) against its state, returning the context, id, status, and the
// resulting state.
func qaTransition(args []string, t ticket.Trigger) (*wsContext, string, *ticket.Status, ticket.State, error) {
	ctx, err := loadContext()
	if err != nil {
		return nil, "", nil, "", err
	}
	id, err := resolveTicket(ctx.Root, args)
	if err != nil {
		return nil, "", nil, "", err
	}
	s, next, err := ctx.transition(id, t)
	if err != nil {
		return nil, "", nil, "", err
	}
	return ctx, id, s, next, nil
}

func runQAApprove(cmd *cobra.Command, args []string) error {
	ctx, id, s, next, err := qaTransition(args, ticket.TriggerQAApprove)
	if err != nil {
		return err
	}
	if _, err := events.Append(ctx.Root, events.Event{
		Ticket:  id,
		From:    string(s.State),
		To:      string(next),
		Trigger: string(ticket.TriggerQAApprove),
	}); err != nil {
		return err
	}
	fmt.Fprintf(cmd.OutOrStdout(), "✓ %s approved by QA (pending-human-qa)\n  next: iudex review %s, then iudex human-qa approve %s\n", id, id, id)
	return nil
}

func runQAReject(cmd *cobra.Command, args []string) error {
	ctx, id, s, next, err := qaTransition(args, ticket.TriggerQAReject)
	if err != nil {
		return err
	}

	// next encodes the reject-ladder outcome (ticket.Apply); recompute count and
	// the limit only for the human-readable message.
	count := s.QARejects + 1
	limit := ctx.Config.QARejectLimit
	failed := next == ticket.StateFailed

	if _, err := events.Append(ctx.Root, events.Event{
		Ticket:  id,
		From:    string(s.State),
		To:      string(next),
		Trigger: string(ticket.TriggerQAReject),
	}); err != nil {
		return err
	}

	out := cmd.OutOrStdout()
	if failed {
		fmt.Fprintf(out, "✗ %s rejected by QA (%d/%d) — moved to failed; needs human intervention\n", id, count, limit)
		fmt.Fprintf(out, "  retry with a fresh attempt: iudex retry %s\n  or abandon: iudex remove %s\n", id, id)
		return nil
	}

	if _, err := os.Stat(filepath.Join(workspace.TaskDir(ctx.Root, id), "review.md")); os.IsNotExist(err) {
		fmt.Fprintln(out, "  note: no .task/review.md found — the next implementation session will have no QA feedback")
	}
	fmt.Fprintf(out, "↩ %s sent back for revision (active) — QA rejection %d", id, count)
	if limit > 0 {
		fmt.Fprintf(out, "/%d", limit)
	}
	fmt.Fprintln(out)
	fmt.Fprintln(out, "  spawn the implementation agent (it will read .task/review.md):")
	fprintSpawnHint(out, ctx.Root, ctx.Config, id, "impl.md")
	return nil
}
