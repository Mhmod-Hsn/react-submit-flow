import type { Metadata } from 'next';
import Link from 'next/link';
import { docs, DocsNav } from '../../../lib/docs';

type PageProps = { params: Promise<{ slug: string[] }> };

export function generateStaticParams() {
  return docs.map(({ slug }) => ({ slug: slug.split('/') }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug: segments } = await params;
  const slug = segments.join('/');
  const page = docs.find((item) => item.slug === slug);
  return { title: page?.title ?? 'Documentation' };
}

export default async function DocPage({ params }: PageProps) {
  const { slug: segments } = await params;
  const slug = segments.join('/');
  const page = docs.find((item) => item.slug === slug);
  if (!page) return <div className="docs-shell"><section className="docs-content"><h1>Page not found</h1><Link href="/docs">Back to docs</Link></section></div>;
  const { Content } = page;
  return (
    <div className="docs-shell">
      <DocsNav activeSlug={slug} />
      <article className="docs-content"><Content /></article>
    </div>
  );
}
