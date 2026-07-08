# Image Download — How It Works

The "Download as Image" feature converts the user's HTML code into a PNG image entirely on the client side. Here's the full pipeline.

## Pipeline Overview

```
User clicks "Download as Image"
        |
        v
1. Pre-fetch images -> convert to base64 data URIs
        |
        v
2. Inject processed HTML into a hidden iframe
        |
        v
3. Wait for fonts + layout to stabilize
        |
        v
4. html2canvas renders iframe content -> canvas
        |
        v
5. Canvas -> PNG blob -> browser download
```

## Step-by-Step

### 1. Image Pre-processing (CORS Fix)

External images (e.g. `https://example.com/photo.jpg`) can't be captured by `html2canvas`'s SVG foreignObject renderer due to CORS restrictions. To fix this, every `<img>` src is fetched and converted to a base64 data URI before rendering.

```ts
async function imgToDataUri(src: string): Promise<string> {
  const res = await fetch(src)
  const blob = await res.blob()
  return await new Promise<string>((resolve, reject) => {
    const reader = new FileReader()
    reader.onloadend = () => resolve(reader.result as string)
    reader.onerror = reject
    reader.readAsDataURL(blob)
  })
}
```

- Uses `DOMParser` to parse the HTML and find all `<img>` tags
- Skips images that are already data URIs (`src.startsWith("data:")`)
- Falls back to the original `src` if the fetch fails

### 2. Hidden Iframe Rendering

The processed HTML (with data URI images) is injected into a hidden iframe via `srcdoc`:

```ts
const iframe = document.createElement("iframe")
iframe.style.position = "fixed"
iframe.style.top = "-9999px"    // offscreen
iframe.style.left = "-9999px"
iframe.style.width = "800px"    // fixed viewport width
iframe.srcdoc = processedHtml
document.body.appendChild(iframe)
```

**Why an iframe?** It provides an isolated document context that renders the user's HTML exactly as it would appear in a real browser — full CSS support (flexbox, grid, animations), no invalid DOM nesting.

### 3. Wait for Fonts and Layout

Before capturing, the code waits for:

1. **Fonts** — `iframeDoc.fonts?.ready` ensures custom web fonts are loaded
2. **Layout stabilization** — 3 `requestAnimationFrame` ticks let the browser finish computing layout, while measuring `scrollHeight` to resize the iframe to fit all content

```ts
await iframeDoc.fonts?.ready

// Resize iframe to fit full content height over 3 frames
await new Promise<void>((resolve) => {
  let frames = 0
  function check() {
    frames++
    const maxHeight = Math.max(
      iframeDoc.body?.scrollHeight ?? 0,
      iframeDoc.documentElement.scrollHeight
    )
    if (maxHeight > 0) iframe.style.height = maxHeight + "px"
    if (frames >= 3) { resolve(); return }
    requestAnimationFrame(check)
  }
  requestAnimationFrame(check)
})
```

### 4. Canvas Capture with html2canvas

```ts
const canvas = await html2canvas(iframeDoc.documentElement, {
  scale: 2,                     // 2x resolution (retina-quality)
  backgroundColor: null,        // transparent background
  logging: false,
  useCORS: true,
  allowTaint: true,
  foreignObjectRendering: true, // uses SVG foreignObject for better CSS fidelity
  width: 800,
  windowWidth: 800,
})
```

**Key option — `foreignObjectRendering: true`:**
Instead of re-implementing CSS layout in canvas, this tells html2canvas to serialize the DOM into an SVG `foreignObject` element, letting the browser's native renderer handle the layout. This produces pixel-perfect output that matches the browser preview.

### 5. PNG Download

```ts
const blob = await new Promise<Blob | null>((resolve) =>
  canvas.toBlob((b) => resolve(b), "image/png")
)
if (blob) {
  const url = URL.createObjectURL(blob)
  const a = document.createElement("a")
  a.href = url
  a.download = projectName ? `${projectName}.png` : "playground.png"
  a.click()
  URL.revokeObjectURL(url)
}
```

Creates a temporary `<a>` element with the PNG blob URL and triggers a download.

## Why Not html-to-image?

We tried `html-to-image` (SVG foreignObject serialization) but it **cannot capture iframe content** — it only sees the `<iframe>` element itself, not what's rendered inside it. This resulted in completely blank images.

## Why Not a Direct div Render?

Rendering the user's HTML directly in a `<div>` (instead of an iframe) breaks CSS because:
- `<html>`, `<head>`, `<body>` tags become nested inside the div (invalid DOM)
- CSS selectors like `body > .container` no longer match
- No isolated document context

## Files Involved

| File | Role |
|------|------|
| `app/page.tsx` | `handleDownloadImage` — the full download pipeline |
| `components/Preview.tsx` | Renders the "Download as Image" button, calls the handler |
| `package.json` | `html2canvas` dependency |
