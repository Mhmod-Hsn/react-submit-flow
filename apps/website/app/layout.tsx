import type { Metadata } from 'next';
import 'react-submit-flow/styles.css';
import 'react-submit-flow/themes/forest.css';
import 'react-submit-flow/themes/high-contrast.css';
import './site.css';
import { Providers } from './providers';
import { SiteHeader } from '../components/site-header';

export const metadata: Metadata = {
  title: { default: 'react-submit-flow', template: '%s · react-submit-flow' },
  description: 'Typed async action flows with accessible, customizable React feedback.',
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>
        <Providers>
          <SiteHeader />
          <main>{children}</main>
          <footer className="site-footer">react-submit-flow · Async actions, handled.</footer>
        </Providers>
      </body>
    </html>
  );
}
