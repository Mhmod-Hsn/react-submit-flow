import Link from 'next/link';
import { exampleGroups } from '../../lib/examples';

export const metadata = { title: 'Examples' };

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
        <h1>Examples for the full flow.</h1>
        <p>Explore the common action, form, dialog, and integration patterns. Runnable entries include a live demo; integration recipes include code you can adapt to your app.</p>
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
