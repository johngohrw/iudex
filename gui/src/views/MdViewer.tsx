import Editor from "@monaco-editor/react";
import "../lib/monacoSetup";

// Read-only single-document Monaco surface for raw markdown (the Specifications
// source pane). Lazy-loaded by the view so Monaco only enters the bundle when a
// PRD is first opened — the same code-split treatment as DiffViewer.
export default function MdViewer({ value }: { value: string }) {
  return (
    <Editor
      value={value}
      language="markdown"
      theme="iudex-light"
      options={{
        readOnly: true,
        automaticLayout: true,
        minimap: { enabled: false },
        scrollBeyondLastLine: false,
        wordWrap: "on",
        fontSize: 12,
        lineNumbers: "on",
        renderLineHighlight: "none",
        stickyScroll: { enabled: false },
        overviewRulerLanes: 0,
      }}
    />
  );
}
