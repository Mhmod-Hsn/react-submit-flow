import Link from 'next/link';
import type { Metadata } from 'next';
import { exampleGroups } from '../../lib/examples';

export const metadata: Metadata = {
  title: 'Examples',
  description: 'Explore compact flow examples and confirmation popup recipes for react-submit-flow.',
};

export default function ExamplesPage() {
  return (
    <div className="docs-shell examples-shell">
      <aside className="docs-nav" aria-label="Examples"><strong>Examples</strong>
        {exampleGroups.map((group) => <div className="docs-nav-section" key={group.title}>
          <span>{group.title}</span>
          {group.items.map((example) => <Link key={example.slug} href={`/examples/${example.slug}`}>{example.title}</Link>)}
        </div>)}
      </aside>
      <section className="docs-content">
        <span className="section-kicker">Runnable recipes</span>
        <h1>Flows and confirms.</h1>
        <p>See how async flows work, then explore confirmation popups and dialog behavior. Each example includes runnable demos or code you can adapt.</p>
        {exampleGroups.map((group) => <section className="docs-index-section" key={group.title}>
          <h2>{group.title}</h2>
          <div className="examples-grid">{group.items.map((example) => <Link className="example-link" href={`/examples/${example.slug}`} key={example.slug}>
            <strong>{example.title}</strong><span>{example.description}</span><small>{example.runnable ? 'Interactive demo' : 'Integration recipe'}</small>
          </Link>)}</div>
        </section>)}
      </section>
    </div>
  );
}
