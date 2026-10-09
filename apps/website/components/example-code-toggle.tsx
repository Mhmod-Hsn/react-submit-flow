'use client';

import { useState } from 'react';

export function ExampleCodeToggle({ shortCode, fullCode, title }: { shortCode: string; fullCode: string; title: string }) {
  const [view, setView] = useState<'short' | 'full'>('short');
  const code = view === 'short' ? shortCode : fullCode;
  return <section className="example-code-view" aria-label={`${title} source code`}>
    <div className="example-code-toolbar">
      <div><strong>Code</strong><span>{view === 'short' ? 'Focused snippet' : 'Full component example'}</span></div>
      <div className="code-view-toggle" role="group" aria-label="Code view">
        <button type="button" aria-pressed={view === 'short'} onClick={() => setView('short')}>Short</button>
        <button type="button" aria-pressed={view === 'full'} onClick={() => setView('full')}>Full code</button>
      </div>
    </div>
    <pre className="code-block"><code>{code}</code></pre>
  </section>;
}
