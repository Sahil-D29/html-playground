import type { Metadata } from "next"
import Link from "next/link"

export const metadata: Metadata = {
  title: "FAQ — Frequently Asked Questions",
  description:
    "Answers to common questions about HTML Playground: how to use the editor, share snippets, save projects, and troubleshoot issues.",
}

const faqs = [
  {
    q: "What is HTML Playground?",
    a: "HTML Playground is a free, browser-based code editor where you can write HTML, CSS, and JavaScript and see a live preview in real time. No installation or setup required.",
  },
  {
    q: "Do I need an account to use it?",
    a: "No. You can write and preview code immediately. An account is only needed if you want to save snippets to a dashboard and organize them into projects.",
  },
  {
    q: "How do I share my code?",
    a: "Click the Share button in the toolbar. You'll get a short URL (like /snippets/abc12345) that anyone can open. You can choose between public (anyone with the link can view) or private (only you can view and edit).",
  },
  {
    q: "Can I edit a shared snippet?",
    a: "Yes. If the snippet's permission is set to public, anyone with the link can edit it. Changes are saved when they click Save. You can also duplicate a shared snippet to your own account.",
  },
  {
    q: "Is my code saved automatically?",
    a: "No. Code in the editor is stored in your browser's local storage and will persist if you close and reopen the tab. However, to save a snippet permanently or share it, you need to use the Save or Share buttons.",
  },
  {
    q: "What happens if I clear my browser data?",
    a: "Any unsaved code in the editor will be lost. Saved snippets (via Share or Dashboard) are stored on the server and will not be affected.",
  },
  {
    q: "Can I use it on my phone?",
    a: "Yes. The editor is fully responsive. On mobile, the editor and preview are stacked vertically so you can see both at once. The touch-friendly interface works well on phones and tablets.",
  },
  {
    q: "Does it support frameworks like React or Vue?",
    a: "Not natively. HTML Playground is designed for plain HTML, CSS, and JavaScript. For frameworks that require a build step, you'd need a different tool. However, you can include CDN-linked libraries like Tailwind CSS or Alpine.js via a script tag.",
  },
  {
    q: "Is there a limit on how many snippets I can save?",
    a: "There's no hard limit, but we recommend keeping your dashboard tidy. Unused snippets can be deleted at any time.",
  },
  {
    q: "Can I download my code?",
    a: "Yes. Click the Download button in the toolbar to save your snippet as a standalone .html file.",
  },
]

const faqSchema = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: faqs.map((faq) => ({
    "@type": "Question",
    name: faq.q,
    acceptedAnswer: {
      "@type": "Answer",
      text: faq.a,
    },
  })),
}

export default function FAQPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
      />
      <div className="mx-auto max-w-3xl px-4 py-12">
        <h1 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-white mb-2">
          Frequently Asked Questions
        </h1>
        <p className="text-gray-500 dark:text-gray-400 mb-8">
          Everything you need to know about HTML Playground.
        </p>
        <div className="space-y-6">
          {faqs.map((faq, i) => (
            <details
              key={i}
              className="group rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-surface-light p-5"
            >
              <summary className="flex cursor-pointer items-center justify-between font-medium text-gray-900 dark:text-white list-none">
                {faq.q}
                <svg
                  className="h-5 w-5 text-gray-400 transition-transform group-open:rotate-180"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                </svg>
              </summary>
              <p className="mt-3 text-gray-600 dark:text-gray-300 leading-relaxed">{faq.a}</p>
            </details>
          ))}
        </div>
        <div className="mt-12 text-center">
          <Link
            href="/"
            className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-emerald-500 transition-colors"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
            </svg>
            Start Coding
          </Link>
        </div>
      </div>
    </>
  )
}
