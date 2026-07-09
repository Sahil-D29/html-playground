"use client"

import CodeMirror from "@uiw/react-codemirror"
import { html } from "@codemirror/lang-html"
import { css } from "@codemirror/lang-css"
import { javascript } from "@codemirror/lang-javascript"
import { oneDark } from "@codemirror/theme-one-dark"
import { EditorView } from "@codemirror/view"
import { useTheme } from "@/components/ThemeProvider"

const lightTheme = EditorView.theme({
  "&": { backgroundColor: "#ffffff" },
  ".cm-gutters": { backgroundColor: "#f8fafc", borderRight: "1px solid #e2e8f0", color: "#94a3b8" },
  ".cm-activeLineGutter": { backgroundColor: "#f1f5f9" },
  ".cm-activeLine": { backgroundColor: "#f8fafc" },
  ".cm-selectionBackground": { backgroundColor: "#dbeafe !important" },
  ".cm-cursor": { borderLeftColor: "#1e293b" },
  "&.cm-focused .cm-selectionBackground": { backgroundColor: "#bfdbfe !important" },
  ".cm-matchingBracket": { backgroundColor: "#dbeafe", outline: "1px solid #93c5fd" },
})

const extensions: Record<string, ReturnType<typeof html>> = {
  html: html(),
  css: css(),
  js: javascript(),
}

export default function Editor({
  value,
  onChange,
  lang = "html",
}: {
  value: string
  onChange: (val: string) => void
  lang?: "html" | "css" | "js"
}) {
  const { theme } = useTheme()

  return (
    <CodeMirror
      value={value}
      height="100%"
      extensions={[extensions[lang]]}
      theme={theme === "dark" ? oneDark : lightTheme}
      onChange={(val) => onChange(val)}
      basicSetup={{
        lineNumbers: true,
        foldGutter: true,
        highlightActiveLine: true,
        autocompletion: false,
        bracketMatching: true,
        closeBrackets: true,
        indentOnInput: true,
      }}
      className="h-full text-sm"
    />
  )
}
