import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { docs, DocsNav } from "../../../lib/docs";

type PageProps = { params: Promise<{ slug: string[] }> };

export function generateStaticParams() {
  return docs.map(({ slug }) => ({ slug: slug.split("/") }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug: segments } = await params;
  const slug = segments.join("/");
  const page = docs.find((item) => item.slug === slug);
  return {
    title: page?.title ?? "Documentation",
    description: page?.description ?? "Guides and API reference for react-submit-flow.",
  };
}

export default async function DocPage({ params }: PageProps) {
  const { slug: segments } = await params;
  const slug = segments.join("/");
  const page = docs.find((item) => item.slug === slug);
  if (!page) notFound();
  const { Content } = page;
  return (
    <div className="docs-shell">
      <DocsNav activeSlug={slug} />
      <article className="docs-content">
        <Content />
      </article>
    </div>
  );
}
