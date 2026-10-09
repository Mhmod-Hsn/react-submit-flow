import Link from 'next/link';
import { ThemeSelector } from './theme-selector';

export function SiteHeader() {
  return (
    <header className="site-header">
      <Link href="/" className="brand"><span className="brand-mark">sf</span><span>react-submit-flow</span></Link>
      <nav aria-label="Main navigation">
        <ThemeSelector />
        <Link href="/docs">Docs</Link>
        <Link href="/examples">Examples</Link>
        <a href="https://www.npmjs.com/package/react-submit-flow" target="_blank" rel="noreferrer">npm ↗</a>
      </nav>
    </header>
  );
}
