import type { ComponentType } from "react";
import { LiveDemo } from "../components/live-demo";
import { DialogDemo } from "../components/dialog-demo";
import {
  PublishDialogDemo,
  UnsavedChangesDialogDemo,
} from "../components/three-action-dialog-demos";
import {
  ConfirmFlowDemo,
  CancelRequestDemo,
  ChainedStepsDemo,
  DeleteDemo,
  DialogDismissalDemo,
  DialogOptionsDemo,
  HeadlessDemo,
  IndependentFlowsDemo,
  NavigationDemo,
  RichDialogDemo,
  RetainedErrorDemo,
  ThemeRtlDemo,
} from "../components/example-demos";

export interface Example {
  slug: string;
  title: string;
  group: string;
  description: string;
  code: string;
  fullCode: string;
  Demo?: ComponentType;
  docHref: string;
  runnable: boolean;
}

type ExampleDefinition = Omit<Example, "fullCode">;

const exampleDefinitions: ExampleDefinition[] = [
  {
    slug: "basic-form",
    title: "Basic form: success and failure",
    group: "Flows",
    description:
      "Submit a typed form, inspect the pending state, and toggle a simulated server error.",
    docHref: "/docs/forms",
    runnable: true,
    Demo: LiveDemo,
    code: `const flow = useSubmitFlow({\n  save: {\n    run: async (input: { name: string }, { signal }) => saveProfile(input, signal),\n    pendingLabel: 'Saving profile…',\n    success: 'Profile saved.',\n    error: 'The example request failed.',\n  },\n})\n\n<SubmitFlowForm flow={flow} defaultAction="save"\n  getInput={{ save: (data) => ({ name: String(data.get('name') ?? '') }) }}>\n  <input name="name" required />\n  <SubmitButton action="save">Save changes</SubmitButton>\n</SubmitFlowForm>`,
  },
  {
    slug: "multi-action",
    title: "Multiple actions",
    group: "Flows",
    description:
      "Give save and publish separate inputs, pending labels, confirmations, and outcomes.",
    docHref: "/docs/api/use-submit-flow",
    runnable: true,
    Demo: LiveDemo,
    code: `const flow = useSubmitFlow({\n  save: { run: saveDraft, pendingLabel: 'Saving…' },\n  publish: {\n    run: publishDraft,\n    confirm: { title: 'Publish this draft?' },\n    pendingLabel: 'Publishing…',\n  },\n})`,
  },
  {
    slug: "confirm-and-flow",
    title: "Confirm, then run a flow",
    group: "Flows",
    description: "A compact example: confirm in a popup, run an async action, and show its result.",
    docHref: "/docs/dialogs",
    runnable: true,
    Demo: ConfirmFlowDemo,
    code: `const flow = useSubmitFlow({
  publish: {
    run: publishNotes,
    confirm: { title: 'Publish these notes?' },
    pendingLabel: 'Publishing…',
    success: 'Notes published.',
  },
})

<SubmitFlowRoot flow={flow}>
  <ActionButton action="publish">Publish notes</ActionButton>
  <SubmitFeedback />
</SubmitFlowRoot>`,
  },
  {
    slug: "delete-confirmation",
    title: "Destructive confirmation",
    group: "Confirms",
    description: "Require explicit confirmation before running a destructive action.",
    docHref: "/docs/dialogs",
    runnable: true,
    Demo: DeleteDemo,
    code: `const flow = useSubmitFlow({\n  remove: {\n    run: ({ id }) => deleteRecord(id),\n    confirm: {\n      title: 'Delete this record?',\n      description: 'This cannot be undone.',\n      destructive: true,\n      confirmLabel: 'Delete',\n    },\n  },\n})`,
  },
  {
    slug: "cancel-request",
    title: "Cancel an abort-aware request",
    group: "Flows",
    description:
      "Pass the signal to work that supports abort and keep the flow busy until it settles.",
    docHref: "/docs/concepts/cancellation",
    runnable: true,
    Demo: CancelRequestDemo,
    code: `run: async (_input, { signal }) => {\n  const response = await fetch('/api/import', { signal })\n  if (!response.ok) throw new Error('Import failed')\n  return response.json()\n}`,
  },
  {
    slug: "cancel-back-navigation",
    title: "Cancel and back navigation",
    group: "Flows",
    description: "Keep navigation callbacks explicit and avoid accidental form submission.",
    docHref: "/docs/api/components",
    runnable: true,
    Demo: NavigationDemo,
    code: `<CancelButton onCancel={returnToList}>Cancel</CancelButton>\n<BackButton onBack={() => router.back()}>Back</BackButton>`,
  },
  {
    slug: "chained-steps",
    title: "Sequential steps",
    group: "Flows",
    description: "Await related steps in one runner for one lock and one final result.",
    docHref: "/docs/concepts/chaining",
    runnable: true,
    Demo: ChainedStepsDemo,
    code: `run: async (input, { signal, throwIfCancelled }) => {\n  const record = await createRecord(input, { signal })\n  throwIfCancelled()\n  await sendNotice(record.id, { signal })\n  return record\n}`,
  },
  {
    slug: "independent-flows",
    title: "Independent forms",
    group: "Flows",
    description: "Use one provider while each form keeps its own busy state and result.",
    docHref: "/docs/concepts/flow-lifecycle",
    runnable: true,
    Demo: IndependentFlowsDemo,
    code: `function DraftForm() {\n  const flow = useSubmitFlow({ save: { run: saveDraft } })\n  return <SubmitFlowRoot flow={flow}>…</SubmitFlowRoot>\n}\n\nfunction PreviewForm() {\n  const flow = useSubmitFlow({ preview: { run: buildPreview } })\n  return <SubmitFlowRoot flow={flow}>…</SubmitFlowRoot>\n}`,
  },
  {
    slug: "nested-dialog-confirmation",
    title: "Confirmation from a dialog form",
    group: "Confirms",
    description:
      "See the composition pattern and its focus-management caveats when a form is already inside a modal.",
    docHref: "/docs/dialogs",
    runnable: false,
    code: `// Place the flow under the same provider as the parent dialog.\n// Verify focus restoration and Escape behavior in your modal stack.\nconst accepted = await feedback.confirm({\n  title: 'Save these changes?',\n  outsidePress: false,\n})`,
  },
  {
    slug: "rhf-validation",
    title: "React Hook Form validation",
    group: "Flows",
    description: "Run the async flow only after React Hook Form accepts the values.",
    docHref: "/docs/integrations/react-hook-form",
    runnable: false,
    code: `const submit = form.handleSubmit(async (values) => {\n  const result = await flow.run('save', values)\n  if (result.status === 'success') form.reset()\n})`,
  },
  {
    slug: "tanstack-mutation",
    title: "TanStack Query mutation",
    group: "Flows",
    description: "Await mutateAsync and let the application choose a single feedback owner.",
    docHref: "/docs/integrations/tanstack-query",
    runnable: false,
    code: `save: {\n  run: async (input) => {\n    const saved = await mutation.mutateAsync(input)\n    await queryClient.invalidateQueries({ queryKey: ['profile'] })\n    return saved\n  },\n  feedback: 'none', // if the mutation already notifies\n}`,
  },
  {
    slug: "server-function",
    title: "Next.js Server Function",
    group: "Flows",
    description:
      "Call a server function from a client flow and map domain failures to safe messages.",
    docHref: "/docs/integrations/next-server-functions",
    runnable: false,
    code: `save: {\n  run: async (input) => {\n    const result = await saveProfile(input)\n    if (!result.ok) throw new Error(result.code)\n    return result.profile\n  },\n  error: mapSafeMessage,\n}`,
  },
  {
    slug: "headless-ui",
    title: "Headless custom controls",
    group: "Flows",
    description: "Render state yourself and import the hook from the headless entry.",
    docHref: "/docs/api/headless-and-adapters",
    runnable: true,
    Demo: HeadlessDemo,
    code: `import { useSubmitFlow } from 'react-submit-flow/headless'\n\n<button disabled={flow.isBusy} onClick={() => void flow.run('save', input)}>\n  {flow.isBusy ? 'Saving…' : 'Save'}\n</button>`,
  },
  {
    slug: "standalone-dialogs",
    title: "Standalone confirm and alert",
    group: "Confirms",
    description: "Ask for confirmation or acknowledgement outside a form.",
    docHref: "/docs/api/provider-and-feedback",
    runnable: true,
    Demo: DialogDemo,
    code: `const confirmed = await feedback.confirm({\n  title: 'Remove this draft?',\n  destructive: true,\n})\nif (confirmed) await removeDraft()\n\nconst result = await feedback.alert({ title: 'Export ready' })`,
  },
  {
    slug: "unsaved-changes-dialog",
    title: "Three actions: save, discard, or cancel",
    group: "Flows",
    description:
      "Handle unsaved edits in a dialog with two async actions and an explicit cancel choice.",
    docHref: "/docs/dialogs",
    runnable: true,
    Demo: UnsavedChangesDialogDemo,
    code: `<SubmitFlowRoot flow={flow}>\n  <CancelButton onCancel={closeDialog}>Cancel</CancelButton>\n  <ActionButton action="discard">Discard changes</ActionButton>\n  <ActionButton action="save">Save changes</ActionButton>\n  <SubmitFeedback />\n</SubmitFlowRoot>\n// Render inside your dialog. Both actions share the flow's busy lock.`,
  },
  {
    slug: "publish-dialog",
    title: "Three actions: draft, publish, or cancel",
    group: "Flows",
    description:
      "Review a release, save a private draft, or publish it. Simulate an error and retry inside the dialog.",
    docHref: "/docs/dialogs",
    runnable: true,
    Demo: PublishDialogDemo,
    code: `const flow = useSubmitFlow({\n  save: {\n    run: saveDraft,\n    pendingLabel: 'Saving draft…',\n    feedback: 'inline',\n    onSuccess: closeDialog,\n  },\n  publish: {\n    run: publishRelease,\n    pendingLabel: 'Publishing…',\n    feedback: 'inline',\n    error: 'Publishing failed. Try again or save a draft.',\n    onSuccess: closeDialog,\n  },\n})\n\n// Dialog footer: CancelButton + save ActionButton + publish ActionButton.`,
  },
  {
    slug: "dialog-options",
    title: "Dialog variants and sizes",
    group: "Confirms",
    description: "Try the supported variants and responsive sizes in the built-in dialog.",
    docHref: "/docs/dialogs",
    runnable: true,
    Demo: DialogOptionsDemo,
    code: `await feedback.confirm({\n  title: 'Continue?',\n  variant: 'warning',\n  size: 'md',\n  closeOnEscape: true,\n  outsidePress: false,\n})`,
  },
  {
    slug: "dialog-dismissal",
    title: "Escape and outside dismissal",
    group: "Confirms",
    description:
      "Configure Escape and backdrop dismissal independently and observe the boolean result.",
    docHref: "/docs/dialogs",
    runnable: true,
    Demo: DialogDismissalDemo,
    code: `const result = await feedback.confirm({\n  title: 'Review these changes?',\n  closeOnEscape: false,\n  outsidePress: true,\n})\n// Escape stays open; clicking outside resolves false.`,
  },
  {
    slug: "rich-dialog-content",
    title: "Rich dialog preview",
    group: "Confirms",
    description: "Add structured React content with plain-text accessible title and description.",
    docHref: "/docs/dialogs",
    runnable: true,
    Demo: RichDialogDemo,
    code: `await feedback.confirm({\n  title: 'Publish release notes?',\n  description: 'Review the summary before publishing.',\n  size: 'lg',\n  content: <ReleasePreview />,\n})`,
  },
  {
    slug: "retained-confirmation",
    title: "Retained confirmation and error",
    group: "Confirms",
    description: "Keep the dialog open during execution and show an error without retrying.",
    docHref: "/docs/dialogs",
    runnable: true,
    Demo: RetainedErrorDemo,
    code: `publish: {\n  run: publishDraft,\n  confirm: { title: 'Publish now?' },\n  closeOnConfirm: false,\n  pendingLabel: 'Publishing…',\n}`,
  },
  {
    slug: "theme-rtl",
    title: "Theme tokens and RTL",
    group: "Confirms",
    description:
      "Use an optional theme and render provider-owned dialogs and notifications in right-to-left layouts.",
    docHref: "/docs/styling",
    runnable: true,
    Demo: ThemeRtlDemo,
    code: `import 'react-submit-flow/styles.css'\nimport 'react-submit-flow/themes/forest.css'\n\n<SubmitFlowProvider dir="rtl">\n  <ArabicPage />\n</SubmitFlowProvider>`,
  },
];

const fullCodeBySlug: Record<string, string> = {
  "confirm-and-flow": `'use client';

import { ActionButton, SubmitFeedback, SubmitFlowRoot, useSubmitFlow } from 'react-submit-flow';

export function PublishNotes() {
  const flow = useSubmitFlow({
    publish: {
      run: async () => {
        await new Promise((resolve) => setTimeout(resolve, 900));
        return 'Release notes';
      },
      confirm: {
        title: 'Publish these notes?',
        description: 'They will be visible to everyone.',
        confirmLabel: 'Publish',
      },
      pendingLabel: 'Publishing…',
      success: (item: string) => \`\${item} published.\`,
    },
  });

  return (
    <SubmitFlowRoot flow={flow}>
      <ActionButton action="publish">Publish notes</ActionButton>
      <SubmitFeedback />
    </SubmitFlowRoot>
  );
}`,
  "unsaved-changes-dialog": `'use client';

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

  return <dialog ref={dialogRef} className="sf-dialog three-action-dialog" aria-labelledby={\`\${id}-title\`} aria-describedby={\`\${id}-description\`}
    onCancel={(event) => {
      event.preventDefault();
      if (!busy) onDismiss();
    }}>
    <span className="section-kicker">Three actions · one flow</span>
    <h2 id={\`\${id}-title\`} className="three-action-title">{title}</h2>
    <p id={\`\${id}-description\`} className="sf-dialog-description">{description}</p>
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
}`,
  "publish-dialog": `'use client';

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

  return <dialog ref={dialogRef} className="sf-dialog three-action-dialog" aria-labelledby={\`\${id}-title\`} aria-describedby={\`\${id}-description\`}
    onCancel={(event) => {
      event.preventDefault();
      if (!busy) onDismiss();
    }}>
    <span className="section-kicker">Three actions · one flow</span>
    <h2 id={\`\${id}-title\`} className="three-action-title">{title}</h2>
    <p id={\`\${id}-description\`} className="sf-dialog-description">{description}</p>
    {children}
  </dialog>;
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
}`,
  "basic-form": `import { SubmitButton, SubmitFlowForm, useSubmitFlow } from 'react-submit-flow'

type Profile = { name: string }

async function saveProfile(profile: Profile, signal: AbortSignal) {
  const response = await fetch('/api/profile', {
    method: 'POST',
    signal,
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(profile),
  })
  if (!response.ok) throw new Error('Could not save profile')
  return response.json() as Promise<{ id: string; name: string }>
}

export function ProfileForm() {
  const flow = useSubmitFlow({
    save: {
      run: (input: Profile, { signal }) => saveProfile(input, signal),
      pendingLabel: 'Saving profile…',
      success: 'Profile saved.',
      error: 'The example request failed.',
    },
  })

  return (
    <SubmitFlowForm flow={flow} defaultAction="save"
      getInput={{ save: (data) => ({ name: String(data.get('name') ?? '') }) }}>
      <label>Name <input name="name" required /></label>
      <SubmitButton action="save">Save changes</SubmitButton>
    </SubmitFlowForm>
  )
}`,
  "multi-action": `import { ActionButton, SubmitFlowRoot, useSubmitFlow } from 'react-submit-flow'

type Draft = { id: string; title: string }

export function DraftActions({ draft }: { draft: Draft }) {
  const flow = useSubmitFlow({
    save: {
      run: async (input: Draft) => ({ ...input, saved: true }),
      pendingLabel: 'Saving…',
      success: 'Draft saved.',
    },
    publish: {
      run: async (input: Draft) => ({ ...input, published: true }),
      confirm: { title: 'Publish this draft?', description: 'Visitors can see it.' },
      pendingLabel: 'Publishing…',
      success: (result: Draft & { published: boolean }) => result.title + ' is live.',
    },
  })

  return <SubmitFlowRoot flow={flow}>
    <ActionButton action="save" input={draft}>Save draft</ActionButton>
    <ActionButton action="publish" input={draft}>Publish</ActionButton>
  </SubmitFlowRoot>
}`,
  "delete-confirmation": `import { ActionButton, SubmitFlowRoot, useSubmitFlow } from 'react-submit-flow'

export function DeleteDraft({ id, title }: { id: string; title: string }) {
  const flow = useSubmitFlow({
    remove: {
      run: async (input: { id: string }) => {
        const response = await fetch('/api/drafts/' + input.id, { method: 'DELETE' })
        if (!response.ok) throw new Error('Delete failed')
        return { id: input.id }
      },
      confirm: {
        title: 'Delete “' + title + '”?',
        description: 'This action cannot be undone.',
        destructive: true,
        confirmLabel: 'Delete draft',
      },
      success: 'Draft deleted.',
      error: 'Could not delete this draft.',
    },
  })

  return <SubmitFlowRoot flow={flow}>
    <ActionButton action="remove" input={{ id }}>Delete draft</ActionButton>
  </SubmitFlowRoot>
}`,
  "cancel-request": `import { ActionButton, CancelButton, SubmitFlowRoot, useSubmitFlow } from 'react-submit-flow'

export function ImportButton() {
  const flow = useSubmitFlow({
    importData: {
      run: async (_input: void, { signal }) => {
        const response = await fetch('/api/import', { method: 'POST', signal })
        if (!response.ok) throw new Error('Import failed')
        return response.json() as Promise<{ imported: number }>
      },
      pendingLabel: 'Importing…',
      success: (result: { imported: number }) => result.imported + ' records imported.',
    },
  })

  return <SubmitFlowRoot flow={flow}>
    <ActionButton action="importData">Start import</ActionButton>
    <CancelButton>Cancel import</CancelButton>
    <p role="status">{flow.status}</p>
  </SubmitFlowRoot>
}`,
  "cancel-back-navigation": `import { useState } from 'react'
import { ActionButton, BackButton, CancelButton, SubmitFlowRoot, useSubmitFlow } from 'react-submit-flow'

export function EditActions({ onBack }: { onBack: () => void }) {
  const [message, setMessage] = useState('')
  const flow = useSubmitFlow({ save: { run: async () => saveChanges(), pendingLabel: 'Saving…' } })

  return <SubmitFlowRoot flow={flow}>
    <ActionButton action="save">Save</ActionButton>
    <CancelButton onCancel={() => setMessage('Cancelled')}>Cancel</CancelButton>
    <BackButton onBack={onBack}>Back</BackButton>
    <p role="status">{message}</p>
  </SubmitFlowRoot>
}`,
  "chained-steps": `import { ActionButton, SubmitFlowRoot, useSubmitFlow } from 'react-submit-flow'

export function CreateAndNotify() {
  const flow = useSubmitFlow({
    createAndNotify: {
      run: async (input: { title: string }, { signal, throwIfCancelled }) => {
        const record = await createRecord(input, { signal })
        throwIfCancelled()
        await sendNotification(record.id, { signal })
        return record
      },
      pendingLabel: 'Creating…',
      success: (record: { id: string }) => 'Created record ' + record.id,
    },
  })

  return <SubmitFlowRoot flow={flow}>
    <ActionButton action="createAndNotify" input={{ title: 'Launch plan' }}>
      Create and notify
    </ActionButton>
  </SubmitFlowRoot>
}`,
  "independent-flows": `import { ActionButton, SubmitFlowRoot, useSubmitFlow } from 'react-submit-flow'

function DraftForm() {
  const flow = useSubmitFlow({ save: { run: async () => saveDraft() } })
  return <SubmitFlowRoot flow={flow}>
    <ActionButton action="save">Save draft</ActionButton>
    <span>{flow.status}</span>
  </SubmitFlowRoot>
}

function PreviewForm() {
  const flow = useSubmitFlow({ preview: { run: async () => buildPreview() } })
  return <SubmitFlowRoot flow={flow}>
    <ActionButton action="preview">Build preview</ActionButton>
    <span>{flow.status}</span>
  </SubmitFlowRoot>
}

export function WorkspaceActions() {
  return <><DraftForm /><PreviewForm /></>
}`,
  "nested-dialog-confirmation": `import { useSubmitFeedback } from 'react-submit-flow'

export function DialogForm() {
  const feedback = useSubmitFeedback()

  async function save() {
    const accepted = await feedback.confirm({
      title: 'Save these changes?',
      outsidePress: false,
    })
    if (!accepted) return
    await saveChanges()
  }

  return <form onSubmit={(event) => { event.preventDefault(); void save() }}>
    <input name="title" />
    <button type="submit">Save</button>
  </form>
}

// Mount DialogForm under SubmitFlowProvider and your modal provider.
// Verify focus restoration and keyboard behavior for your modal stack.`,
  "rhf-validation": `import { useForm } from 'react-hook-form'
import { SubmitFeedback, SubmitFlowRoot, useSubmitFlow } from 'react-submit-flow'

type Values = { email: string }

export function InviteForm() {
  const form = useForm<Values>()
  const flow = useSubmitFlow({
    invite: { run: (values: Values) => sendInvite(values), success: 'Invite sent.' },
  })

  return <SubmitFlowRoot flow={flow}>
    <form onSubmit={form.handleSubmit(async (values) => {
      const result = await flow.run('invite', values)
      if (result.status === 'success') form.reset()
    })}>
      <input {...form.register('email', { required: true })} />
      {form.formState.errors.email && <p role="alert">Email is required</p>}
      <button type="submit" disabled={flow.isBusy}>Invite</button>
      <SubmitFeedback />
    </form>
  </SubmitFlowRoot>
}`,
  "tanstack-mutation": `import { useMutation, useQueryClient } from '@tanstack/react-query'
import { ActionButton, SubmitFlowRoot, useSubmitFlow } from 'react-submit-flow'

export function ProfileSave({ profile }: { profile: Profile }) {
  const queryClient = useQueryClient()
  const mutation = useMutation({ mutationFn: updateProfile })
  const flow = useSubmitFlow({
    save: {
      run: async (input: Profile) => {
        const saved = await mutation.mutateAsync(input)
        await queryClient.invalidateQueries({ queryKey: ['profile'] })
        return saved
      },
      success: 'Profile updated.',
      feedback: 'none', // Use this if the mutation already notifies.
    },
  })

  return <SubmitFlowRoot flow={flow}>
    <ActionButton action="save" input={profile}>Save profile</ActionButton>
  </SubmitFlowRoot>
}`,
  "server-function": `// actions.ts
'use server'
export async function saveProfile(input: ProfileInput) {
  await requireCurrentUser()
  return updateProfile(input)
}

// profile-form.tsx
'use client'
import { saveProfile } from './actions'
import { useSubmitFlow } from 'react-submit-flow'

export function ProfileForm() {
  const flow = useSubmitFlow({
    save: {
      run: async (input: ProfileInput) => {
        const result = await saveProfile(input)
        if (!result.ok) throw new Error(result.code)
        return result.profile
      },
      error: (error) => error instanceof Error && error.message === 'NAME_TAKEN'
        ? 'Choose a different name.'
        : 'Could not save the profile.',
    },
  })
  return <button disabled={flow.isBusy} onClick={() => void flow.run('save', values)}>
    {flow.isBusy ? 'Saving…' : 'Save'}
  </button>
}`,
  "headless-ui": `import { useSubmitFlow } from 'react-submit-flow/headless'

export function CustomSave({ input }: { input: { title: string } }) {
  const flow = useSubmitFlow({
    save: {
      run: async (value: { title: string }) => saveDraft(value),
      pendingLabel: 'Saving…',
    },
  })

  return <>
    <button disabled={flow.isBusy} onClick={() => void flow.run('save', input)}>
      {flow.isBusy ? flow.pendingLabel : 'Save'}
    </button>
    <p role={flow.status === 'error' ? 'alert' : 'status'}>{flow.status}</p>
  </>
}`,
  "standalone-dialogs": `import { useSubmitFeedback } from 'react-submit-flow'

export function ExportButton() {
  const feedback = useSubmitFeedback()

  async function exportData() {
    const accepted = await feedback.confirm({
      title: 'Start export?',
      description: 'Create a downloadable snapshot.',
      confirmLabel: 'Export',
    })
    if (!accepted) return
    const result = await createExport()
    await feedback.alert({
      title: 'Export ready',
      description: 'Your export contains ' + result.count + ' records.',
      variant: 'success',
      acknowledgeLabel: 'Done',
    })
  }

  return <button type="button" onClick={() => void exportData()}>Export</button>
}`,
  "dialog-options": `import { useSubmitFeedback } from 'react-submit-flow'

export function ContinueButton() {
  const feedback = useSubmitFeedback()

  async function continueFlow() {
    const accepted = await feedback.confirm({
      title: 'Continue with these changes?',
      description: 'Review this summary before continuing.',
      variant: 'warning',
      size: 'md',
      width: 'min(36rem, calc(100vw - 2rem))',
      closeOnEscape: true,
      outsidePress: false,
      confirmLabel: 'Continue',
      cancelLabel: 'Review again',
      content: <p>Three settings will be updated.</p>,
    })
    if (accepted) await continueAction()
  }

  return <button type="button" onClick={() => void continueFlow()}>Continue</button>
}`,
  "dialog-dismissal": `import { useState } from 'react'
import { useSubmitFeedback } from 'react-submit-flow'

export function DismissalControls() {
  const feedback = useSubmitFeedback()
  const [result, setResult] = useState('')

  async function ask(options: { closeOnEscape?: boolean; outsidePress?: boolean }) {
    const accepted = await feedback.confirm({
      title: 'Review these changes?',
      description: 'Try Escape, the backdrop, or an explicit choice.',
      ...options,
    })
    setResult(accepted ? 'Confirmed' : 'Dismissed or cancelled')
  }

  return <>
    <button onClick={() => void ask({ closeOnEscape: true, outsidePress: false })}>
      Escape closes
    </button>
    <button onClick={() => void ask({ closeOnEscape: false, outsidePress: true })}>
      Outside click closes
    </button>
    <p role="status">{result}</p>
  </>
}`,
  "rich-dialog-content": `import { useSubmitFeedback } from 'react-submit-flow'

export function ReleasePreviewButton() {
  const feedback = useSubmitFeedback()

  async function reviewRelease() {
    const accepted = await feedback.confirm({
      title: 'Publish the release notes?',
      description: 'Review the summary before publishing.',
      variant: 'info',
      size: 'lg',
      confirmLabel: 'Publish notes',
      content: <ReleasePreview />,
    })
    if (accepted) await publishNotes()
  }

  return <button onClick={() => void reviewRelease()}>Preview release notes</button>
}`,
  "retained-confirmation": `import { ActionButton, SubmitFlowRoot, useSubmitFlow } from 'react-submit-flow'

export function PublishButton() {
  const flow = useSubmitFlow({
    publish: {
      run: async (input: { id: string }, { signal }) => {
        const response = await fetch('/api/publish/' + input.id, { method: 'POST', signal })
        if (!response.ok) throw new Error('Publish failed')
        return response.json() as Promise<{ url: string }>
      },
      confirm: { title: 'Publish this update?', confirmLabel: 'Publish' },
      closeOnConfirm: false,
      pendingLabel: 'Publishing…',
      error: 'The publish failed. Close this dialog and start a new attempt.',
    },
  })

  return <SubmitFlowRoot flow={flow}>
    <ActionButton action="publish" input={{ id: 'draft-1' }}>Publish</ActionButton>
  </SubmitFlowRoot>
}`,
  "theme-rtl": `// app/layout.tsx
import 'react-submit-flow/styles.css'
import 'react-submit-flow/themes/forest.css'

export default function Layout({ children }: { children: React.ReactNode }) {
  return <html lang="ar" dir="rtl" data-theme="forest">
    <body>{children}</body>
  </html>
}

/* Or define tokens in your own stylesheet. */
:root {
  --sf-accent: #347a58;
  --sf-danger: #b42318;
}`,
};

export const examples: Example[] = exampleDefinitions.map((example) => ({
  ...example,
  fullCode: fullCodeBySlug[example.slug] ?? example.code,
}));

export const exampleGroups = [...new Set(examples.map((example) => example.group))].map(
  (title) => ({
    title,
    items: examples.filter((example) => example.group === title),
  }),
);
