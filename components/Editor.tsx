"use client"

import CodeMirror from "@uiw/react-codemirror"
import { html } from "@codemirror/lang-html"
import { css } from "@codemirror/lang-css"
import { javascript } from "@codemirror/lang-javascript"
import { oneDark } from "@codemirror/theme-one-dark"

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
  return (
    <CodeMirror
      value={value}
      height="100%"
      extensions={[extensions[lang]]}
      theme={oneDark}
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
