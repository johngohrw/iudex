import ViewHeader from "../components/ViewHeader";
import { VIEWS } from "../types";

// Placeholder: the Dashboard reskin is deferred, so for now this is just the
// view header. The old glanceable router was removed pending a redesign.
export default function Dashboard() {
  return (
    <div style={{ height: "100%", display: "flex", flexDirection: "column", background: "#929292" }}>
      <ViewHeader dot={VIEWS.dashboard.dot} title="Dashboard" />
    </div>
  );
}
