'use client';

import { useState, type ReactNode } from 'react';
import {
  ActionButton,
  BackButton,
  CancelButton,
  SubmitFeedback,
  SubmitFlowRoot,
  useSubmitFeedback,
  useSubmitFlow,
} from 'react-submit-flow';

function pause(ms: number, signal?: AbortSignal) {
  return new Promise<void>((resolve, reject) => {
    if (signal?.aborted) return reject(new DOMException('Cancelled', 'AbortError'));
    const timer = setTimeout(() => {
      signal?.removeEventListener('abort', onAbort);
      resolve();
    }, ms);
    function onAbort() {
      clearTimeout(timer);
      reject(new DOMException('Cancelled', 'AbortError'));
    }
    signal?.addEventListener('abort', onAbort, { once: true });
  });
}

function DemoCard({ title, description, children }: { title: string; description: string; children: ReactNode }) {
  return <section className="demo-card example-demo-card"><div className="demo-head"><span className="status-dot" />{title}</div><p>{description}</p>{children}</section>;
}

export function DeleteDemo() {
  const flow = useSubmitFlow({
    delete: {
      run: async (input: { name: string }) => ({ deleted: input.name }),
      confirm: { title: 'Delete this draft?', description: 'This action cannot be undone.', destructive: true, confirmLabel: 'Delete draft' },
      success: (result: { deleted: string }) => `${result.deleted} was deleted.`,
    },
  });
  return <DemoCard title="Destructive confirmation" description="Decline the prompt or confirm the sample deletion.">
    <SubmitFlowRoot flow={flow}><div className="demo-actions"><ActionButton action="delete" input={{ name: 'Q4 launch draft' }} className="demo-primary">Delete draft</ActionButton></div><SubmitFeedback /></SubmitFlowRoot>
  </DemoCard>;
}

export function CancelRequestDemo() {
  const flow = useSubmitFlow({
    importData: {
      run: async (_input: void, { signal }: { signal: AbortSignal }) => {
        await pause(2500, signal);
        return 'Import complete';
      },
      pendingLabel: 'Importing…',
      success: 'Import complete.',
    },
  });
  return <DemoCard title="Abort-aware request" description="Start the simulated import, then cancel it. The flow stays busy until the runner settles.">
    <SubmitFlowRoot flow={flow}><div className="demo-actions"><ActionButton action="importData" className="demo-primary">Start import</ActionButton><CancelButton>Cancel import</CancelButton></div><SubmitFeedback /></SubmitFlowRoot>
  </DemoCard>;
}

export function NavigationDemo() {
  const [message, setMessage] = useState('No navigation requested.');
  const flow = useSubmitFlow({ save: { run: async () => { await pause(1600); return true; }, pendingLabel: 'Saving…', success: 'Changes saved.' } });
  return <DemoCard title="Cancel and back controls" description="Back is disabled during work. Cancel requests abort while busy and calls its callback while idle.">
    <SubmitFlowRoot flow={flow}><div className="demo-actions"><ActionButton action="save" className="demo-primary">Save first</ActionButton><CancelButton onCancel={() => setMessage('Idle cancel callback ran.')}>Cancel</CancelButton><BackButton onBack={() => setMessage('Back callback ran.')}>Back</BackButton></div><SubmitFeedback /><p className="demo-feedback" aria-live="polite">{message}</p></SubmitFlowRoot>
  </DemoCard>;
}

export function ChainedStepsDemo() {
  const [step, setStep] = useState('Ready');
  const flow = useSubmitFlow({
    createAndNotify: {
      run: async (_input: void, { signal, throwIfCancelled }: { signal: AbortSignal; throwIfCancelled(): void }) => {
        setStep('Creating record…');
        await pause(700, signal);
        throwIfCancelled();
        setStep('Sending notification…');
        await pause(700, signal);
        return { id: 'sample-42' };
      },
      success: 'Record created and notification queued.',
    },
  });
  return <DemoCard title="Sequential steps" description="One runner awaits two steps and reports one final flow result.">
    <SubmitFlowRoot flow={flow}><div className="demo-actions"><ActionButton action="createAndNotify" className="demo-primary">Run both steps</ActionButton></div><p className="demo-feedback" aria-live="polite">{step}</p><SubmitFeedback /></SubmitFlowRoot>
  </DemoCard>;
}

function IndependentPanel({ action, label, delay }: { action: 'save' | 'preview'; label: string; delay: number }) {
  const flow = useSubmitFlow({ [action]: { run: async () => { await pause(delay); return true; }, pendingLabel: `${label}…`, success: `${label} finished.` } });
  return <div className="independent-panel"><SubmitFlowRoot flow={flow}><ActionButton action={action} className="demo-secondary">{label}</ActionButton><span className="state-pill">{flow.status}</span><SubmitFeedback /></SubmitFlowRoot></div>;
}

export function IndependentFlowsDemo() {
  return <DemoCard title="Independent flows" description="These two action groups share the provider but keep separate locks and statuses. Start both before either finishes.">
    <div className="independent-grid"><IndependentPanel action="save" label="Save draft" delay={1800} /><IndependentPanel action="preview" label="Build preview" delay={2800} /></div>
  </DemoCard>;
}

export function DialogOptionsDemo() {
  const feedback = useSubmitFeedback();
  const [result, setResult] = useState('Choose a dialog option.');
  const show = async (variant: 'neutral' | 'danger' | 'warning' | 'success' | 'info', size: 'sm' | 'md' | 'lg') => {
    const accepted = await feedback.confirm({ title: `${variant} · ${size}`, description: 'This prompt demonstrates the selected presentation options.', variant, size, confirmLabel: 'Continue' });
    setResult(accepted ? 'Confirmed.' : 'Dismissed.');
  };
  return <DemoCard title="Dialog variants and sizes" description="Try variants and sizes. Escape dismisses; outside click is disabled unless requested.">
    <div className="dialog-option-grid">{(['neutral', 'danger', 'warning', 'success', 'info'] as const).map((variant) => <button key={`${variant}-md`} className="demo-secondary sf-button" type="button" onClick={() => void show(variant, 'md')}>{variant}</button>)}{(['sm', 'md', 'lg'] as const).map((size) => <button key={`size-${size}`} className="demo-secondary sf-button" type="button" onClick={() => void show('info', size)}>{size} size</button>)}</div>
    <p className="demo-feedback" aria-live="polite">{result}</p>
  </DemoCard>;
}

export function RetainedErrorDemo() {
  const flow = useSubmitFlow({
    publish: {
      run: async () => { await pause(600); throw new Error('sample failure'); },
      confirm: { title: 'Publish this update?', description: 'The sample runner will fail so you can inspect the retained error state.', confirmLabel: 'Publish' },
      closeOnConfirm: false,
      pendingLabel: 'Publishing…',
      error: 'The simulated publish failed. Close the dialog, then start a new attempt.',
    },
  });
  return <DemoCard title="Retained confirmation error" description="The confirmation remains open through execution and displays the error. Closing it does not retry.">
    <SubmitFlowRoot flow={flow}><div className="demo-actions"><ActionButton action="publish" className="demo-primary">Publish</ActionButton></div><SubmitFeedback /></SubmitFlowRoot>
  </DemoCard>;
}

export function HeadlessDemo() {
  const flow = useSubmitFlow({ preview: { run: async () => { await pause(700); return 'preview-1'; } } });
  return <DemoCard title="Custom, headless controls" description="The headless hook exposes state and results; the app supplies this button and status UI.">
    <button type="button" className="demo-primary sf-button" disabled={flow.isBusy} onClick={() => void flow.run('preview', undefined)}>
      {flow.isBusy ? 'Building preview…' : 'Build preview'}
    </button>
    <p className="demo-feedback" role="status">Status: {flow.status}{flow.lastResult?.status === 'success' ? ` · ${flow.lastResult.data}` : ''}</p>
  </DemoCard>;
}

export function ThemeRtlDemo() {
  return <div dir="rtl"><DemoCard title="RTL and theme tokens" description="The component uses logical layout properties and inherits text direction. Theme presets are shown on the styling guide.">
    <p className="demo-feedback">مثال على تخطيط من اليمين إلى اليسار</p>
  </DemoCard></div>;
}
