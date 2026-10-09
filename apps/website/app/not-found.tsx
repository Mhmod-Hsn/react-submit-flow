import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Page not found',
  description: 'The page you requested could not be found. Browse the react-submit-flow documentation and examples.',
};

export default function NotFound() {
  return <section className="not-found-shell" aria-labelledby="not-found-title">
    <div className="not-found-content">
      <span className="section-kicker">404 · Page not found</span>
      <h1 id="not-found-title">This page wandered off.</h1>
      <p>That address doesn’t lead to a page. Head back to the documentation or browse the examples.</p>
      <div className="hero-actions">
        <Link className="button button-dark" href="/docs">Browse documentation <span aria-hidden="true">→</span></Link>
        <Link className="button button-light" href="/examples">Explore examples</Link>
      </div>
    </div>
  </section>;
}
