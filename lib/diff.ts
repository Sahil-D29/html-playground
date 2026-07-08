export type DiffPart = {
  text: string
  type: "added" | "removed" | "unchanged"
}

export function diffHtml(original: string, edited: string): DiffPart[] {
  if (original === edited) return [{ text: original, type: "unchanged" }]
  if (!original) return [{ text: edited, type: "added" }]
  if (!edited) return [{ text: original, type: "removed" }]

  const origTokens = tokenize(original)
  const editTokens = tokenize(edited)
  const lcs = computeLCS(origTokens, editTokens)

  const result: DiffPart[] = []
  let oi = 0
  let ei = 0
  let li = 0

  while (oi < origTokens.length || ei < editTokens.length) {
    if (
      li < lcs.length &&
      oi < origTokens.length &&
      ei < editTokens.length &&
      origTokens[oi] === lcs[li] &&
      editTokens[ei] === lcs[li]
    ) {
      result.push({ text: lcs[li], type: "unchanged" })
      oi++
      ei++
      li++
    } else if (
      ei >= editTokens.length ||
      (oi < origTokens.length &&
        li < lcs.length &&
        origTokens[oi] !== lcs[li])
    ) {
      result.push({ text: origTokens[oi], type: "removed" })
      oi++
    } else {
      result.push({ text: editTokens[ei], type: "added" })
      ei++
    }
  }

  return mergeAdjacent(result)
}

function tokenize(text: string): string[] {
  const tokens: string[] = []
  let i = 0
  while (i < text.length) {
    if (text[i] === "<") {
      const end = text.indexOf(">", i)
      if (end !== -1) {
        tokens.push(text.slice(i, end + 1))
        i = end + 1
      } else {
        tokens.push(text[i])
        i++
      }
    } else if (text[i] === "&") {
      const end = text.indexOf(";", i)
      if (end !== -1 && end - i < 10) {
        tokens.push(text.slice(i, end + 1))
        i = end + 1
      } else {
        tokens.push(text[i])
        i++
      }
    } else {
      let j = i
      while (j < text.length && text[j] !== "<" && text[j] !== "&") j++
      tokens.push(text.slice(i, j))
      i = j
    }
  }
  return tokens
}

function computeLCS(a: string[], b: string[]): string[] {
  const m = a.length
  const n = b.length
  const dp: number[][] = Array.from({ length: m + 1 }, () =>
    new Array(n + 1).fill(0)
  )

  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      if (a[i - 1] === b[j - 1]) {
        dp[i][j] = dp[i - 1][j - 1] + 1
      } else {
        dp[i][j] = Math.max(dp[i - 1][j], dp[i][j - 1])
      }
    }
  }

  const lcs: string[] = []
  let i = m
  let j = n
  while (i > 0 && j > 0) {
    if (a[i - 1] === b[j - 1]) {
      lcs.unshift(a[i - 1])
      i--
      j--
    } else if (dp[i - 1][j] > dp[i][j - 1]) {
      i--
    } else {
      j--
    }
  }
  return lcs
}

function mergeAdjacent(parts: DiffPart[]): DiffPart[] {
  if (parts.length === 0) return []
  const merged: DiffPart[] = [parts[0]]
  for (let i = 1; i < parts.length; i++) {
    const last = merged[merged.length - 1]
    if (last.type === parts[i].type) {
      last.text += parts[i].text
    } else {
      merged.push({ ...parts[i] })
    }
  }
  return merged
}
