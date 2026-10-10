'use client';

import { useEffect, useId, useRef, useState, type ReactNode } from 'react';
import { ActionButton, CancelButton, SubmitFeedback, SubmitFlowRoot, useSubmitFlow } from 'react-submit-flow';

function simulateRequest(signal: AbortSignal) {
  return new Promise<void>((resolve, reject) => {
    const onAbort = () => {
      clearTimeout(timer);
      reject(new DOMException('Cancelled', 'AbortError'));
    };
    const timer = setTimeout(() => {
      signal.removeEventListener('abort', onAbort);
      resolve();
    }, 1400);
    if (signal.aborted) onAbort();
    else signal.addEventListener('abort', onAbort, { once: true });
  });
}

function ThreeActionDialog({ open, title, description, busy, onDismiss, children }: {
  open: boolean;
  title: string;
  description: string;
  busy: boolean;
  onDismiss: () => void;
  children: ReactNode;
}) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const id = useId();

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog || !open) return;
    dialog.showModal();
    dialog.querySelector<HTMLButtonElement>('.three-action-cancel')?.focus();
    return () => dialog.close();
  }, [open]);

  return <dialog ref={dialogRef} className="sf-dialog three-action-dialog" aria-labelledby={`${id}-title`} aria-describedby={`${id}-description`}
    onCancel={(event) => {
      event.preventDefault();
      if (!busy) onDismiss();
    }}>
    <span className="section-kicker">Three actions · one flow</span>
    <h2 id={`${id}-title`} className="three-action-title">{title}</h2>
    <p id={`${id}-description`} className="sf-dialog-description">{description}</p>
    {children}
  </dialog>;
}

export function UnsavedChangesDialogDemo() {
  const [open, setOpen] = useState(false);
  const [result, setResult] = useState('No changes have been saved or discarded.');
  const finish = (message: string) => {
    setResult(message);
    setOpen(false);
  };
  const flow = useSubmitFlow({
    save: {
      run: async (_input: void, { signal }) => simulateRequest(signal),
      pendingLabel: 'Saving changes…',
      success: 'Changes saved.',
      feedback: 'inline',
      error: 'Could not save your changes. Try again.',
      onSuccess: () => finish('Changes saved. You can leave the editor.'),
    },
    discard: {
      run: async (_input: void, { signal }) => simulateRequest(signal),
      pendingLabel: 'Discarding changes…',
      success: 'Changes discarded.',
      feedback: 'inline',
      error: 'Could not discard your changes. Try again.',
      onSuccess: () => finish('Changes discarded. The original draft is unchanged.'),
    },
  });
  return <section className="demo-card example-demo-card">
    <div className="demo-head"><span className="status-dot" />Unsaved changes</div>
    <p>Save your edits, discard them, or cancel to keep editing. During a request, Cancel stops the work and keeps the dialog open.</p>
    <button type="button" className="sf-button demo-primary" onClick={() => { flow.reset(); setOpen(true); }}>Leave editor</button>
    <p className="demo-feedback" role="status">{result}</p>
    <ThreeActionDialog open={open} title="Save your changes?" description="You have unsaved edits to the launch announcement. Choose what to keep before leaving." busy={flow.isBusy} onDismiss={() => finish('Cancelled. Your unsaved edits are still here.')}>
      <div className="dialog-preview"><strong>Launch announcement</strong><p>Updated headline and two new release highlights.</p><span className="state-pill">Draft · Unsaved changes</span></div>
      <SubmitFlowRoot flow={flow}>
        <div className="three-action-footer">
          <CancelButton className="three-action-cancel" onCancel={() => finish('Cancelled. Your unsaved edits are still here.')} autoFocus>{flow.status === 'cancelling' ? 'Cancelling…' : 'Cancel'}</CancelButton>
          <ActionButton action="discard" className="three-action-danger">Discard changes</ActionButton>
          <ActionButton action="save" className="sf-button-primary">Save changes</ActionButton>
        </div>
        <SubmitFeedback />
        {flow.status === 'cancelled' ? <p className="demo-feedback" role="status">Request cancelled. Your edits are still here; choose an action or cancel to return.</p> : null}
      </SubmitFlowRoot>
    </ThreeActionDialog>
  </section>;
}

export function PublishDialogDemo() {
  const [open, setOpen] = useState(false);
  const [failPublish, setFailPublish] = useState(false);
  const [result, setResult] = useState('The release is still a draft.');
  const finish = (message: string) => {
    setResult(message);
    setOpen(false);
  };
  const flow = useSubmitFlow({
    save: {
      run: async (_input: void, { signal }) => simulateRequest(signal),
      pendingLabel: 'Saving draft…',
      success: 'Draft saved privately.',
      feedback: 'inline',
      error: 'Could not save the draft. Try again.',
      onSuccess: () => finish('Draft saved privately. Nothing has been published.'),
    },
    publish: {
      run: async (input: { fail: boolean }, { signal }) => {
        await simulateRequest(signal);
        if (input.fail) throw new Error('Simulated publish failure');
      },
      pendingLabel: 'Publishing…',
      success: 'Release 2.4 published.',
      feedback: 'inline',
      error: 'Publishing failed. Turn off the simulated error and retry, or save a draft instead.',
      onSuccess: () => finish('Release 2.4 is published and visible to everyone.'),
    },
  });
  return <section className="demo-card example-demo-card">
    <div className="demo-head"><span className="status-dot" />Release review</div>
    <p>Save privately, publish now, or cancel. Try a publish failure to see the dialog stay open with both actions available for a new attempt.</p>
    <button type="button" className="sf-button demo-primary" onClick={() => { flow.reset(); setOpen(true); }}>Review release</button>
    <p className="demo-feedback" role="status">{result}</p>
    <ThreeActionDialog open={open} title="Ready to share this release?" description="Save a private draft or publish the release notes for everyone to see." busy={flow.isBusy} onDismiss={() => finish('Cancelled. The release was left unchanged.')}>
      <div className="dialog-preview"><strong>Release 2.4</strong><p>Keyboard improvements, new themes, and clearer cancellation feedback.</p><span className="state-pill">Audience · Everyone</span></div>
      <label className="demo-toggle"><input type="checkbox" checked={failPublish} disabled={flow.isBusy} onChange={(event) => setFailPublish(event.target.checked)} />Simulate a publish error</label>
      <SubmitFlowRoot flow={flow}>
        <div className="three-action-footer">
          <CancelButton className="three-action-cancel" onCancel={() => finish('Cancelled. The release was left unchanged.')} autoFocus>{flow.status === 'cancelling' ? 'Cancelling…' : 'Cancel'}</CancelButton>
          <ActionButton action="save">Save draft</ActionButton>
          <ActionButton action="publish" input={{ fail: failPublish }} className="sf-button-primary">Publish release</ActionButton>
        </div>
        <SubmitFeedback />
        {flow.status === 'cancelled' ? <p className="demo-feedback" role="status">Request cancelled. Save a draft, publish again, or cancel to return.</p> : null}
      </SubmitFlowRoot>
    </ThreeActionDialog>
  </section>;
}
