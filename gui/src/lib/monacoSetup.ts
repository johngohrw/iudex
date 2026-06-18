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
