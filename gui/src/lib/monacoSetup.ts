// Bundle Monaco locally instead of fetching it from a CDN — this is a desktop
// app that must work offline and under Tauri's CSP. The base editor worker also
// drives diff computation; we skip the per-language (IntelliSense) workers.
// Syntax highlighting is main-thread, so colors still work without them. Imported
// for its side effects by every lazy Monaco surface (DiffViewer, MergeEditor) so
// the setup runs exactly once, in the code-split chunk.
import { loader } from "@monaco-editor/react";
import * as monaco from "monaco-editor";
import editorWorker from "monaco-editor/esm/vs/editor/editor.worker?worker";

self.MonacoEnvironment = { getWorker: () => new editorWorker() };
loader.config({ monaco });

// A light theme on the design system's gray surfaces (not stark white). Used by
// the read-only DiffViewer; diff tints are soft so the gray reads through.
monaco.editor.defineTheme("iudex-light", {
  base: "vs",
  inherit: true,
  rules: [],
  colors: {
    "editor.background": "#dadada",
    "editorGutter.background": "#dadada",
    "editor.lineHighlightBackground": "#cfcfcf",
    "editorLineNumber.foreground": "#7a7a7a",
    "editorLineNumber.activeForeground": "#2a2a2a",
    "editorIndentGuide.background1": "#c4c4c4",
    "diffEditor.insertedLineBackground": "#a8cf9e55",
    "diffEditor.removedLineBackground": "#dba8a855",
    "diffEditor.insertedTextBackground": "#7cc47855",
    "diffEditor.removedTextBackground": "#dd909055",
    "diffEditor.diagonalFill": "#c4c4c4",
    "editorOverviewRuler.border": "#9a9a9a",
  },
});
