import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { examples } from '../../../lib/examples';

type PageProps = { params: Promise<{ slug: string }> };

export function generateStaticParams() {
  return examples.map(({ slug }) => ({ slug }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const example = examples.find((item) => item.slug === slug);
  return { title: example?.title ?? 'Example' };
}

export default async function ExamplePage({ params }: PageProps) {
  const { slug } = await params;
  const example = examples.find((item) => item.slug === slug);
  if (!example) notFound();
  const Demo = example.Demo;
  return <div className="docs-shell examples-shell">
    <aside className="docs-nav" aria-label="Examples"><Link href="/examples"><strong>All examples</strong></Link>
      {examples.map((item) => <Link key={item.slug} href={`/examples/${item.slug}`} aria-current={item.slug === slug ? 'page' : undefined}>{item.title}</Link>)}
    </aside>
    <article className="docs-content">
      <Link className="text-link" href="/examples">← All examples</Link>
      <span className="section-kicker">{example.group}</span>
      <h1>{example.title}</h1>
      <p>{example.description}</p>
      {Demo ? <Demo /> : <div className="recipe-note">This integration recipe is not installed in the docs app. Copy the pattern into a project with the named integration dependency.</div>}
      <h2>Usage</h2>
      <pre className="code-block"><code>{example.code}</code></pre>
      <p><Link className="text-link" href={example.docHref}>Read the related guide →</Link></p>
      {example.runnable ? <p className="example-note">This demo uses a local, temporary action. It does not send data or write to a service.</p> : null}
    </article>
  </div>;
}
