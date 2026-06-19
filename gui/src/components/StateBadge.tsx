import s from "./StateBadge.module.scss";

// The ticket-lifecycle state pill, shared by every view that shows a ticket
// (Tickets, Dashboard, Review, Agents). pending-qa and pending-human-qa share
// one look.
const CLASS: Record<string, string> = {
  queued: s.queued,
  active: s.active,
  "pending-qa": s.pending,
  "pending-human-qa": s.pending,
  done: s.done,
  failed: s.failed,
  removed: s.removed,
};

export default function StateBadge({ state }: { state: string }) {
  return <span className={`${s.badge} ${CLASS[state] ?? ""}`}>{state}</span>;
}
