import Link from "next/link";
import type { Metadata } from "next";
import { docSections, DocsNav } from "../../lib/docs";

export const metadata: Metadata = {
  title: "Documentation",
  description:
    "Browse the react-submit-flow guides, concepts, API reference, integrations, and troubleshooting help.",
};

export default function DocsIndex() {
  return (
    <div className="docs-shell">
      <DocsNav />
      <section className="docs-content">
        <span className="section-kicker">Documentation</span>
        <h1>Build a calmer submit flow.</h1>
        <p>
          Typed async actions, accessible feedback, and dialogs that work with the forms you already
          have.
        </p>
        {docSections.map((section) => (
          <section className="docs-index-section" key={section.title}>
            <h2>{section.title}</h2>
            <div className="examples-grid">
              {section.pages.map((page) => (
                <Link href={`/docs/${page.slug}`} className="example-link" key={page.slug}>
                  <strong>{page.title}</strong>
                  <span>{page.description}</span>
                </Link>
              ))}
            </div>
          </section>
        ))}
        <Link className="text-link" href="/examples">
          Browse all runnable examples →
        </Link>
      </section>
    </div>
  );
}
