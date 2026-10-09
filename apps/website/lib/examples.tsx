import type { ComponentType } from 'react';
import { LiveDemo } from '../components/live-demo';
import { DialogDemo } from '../components/dialog-demo';
import {
  CancelRequestDemo,
  ChainedStepsDemo,
  DeleteDemo,
  DialogOptionsDemo,
  HeadlessDemo,
  IndependentFlowsDemo,
  NavigationDemo,
  RetainedErrorDemo,
  ThemeRtlDemo,
} from '../components/example-demos';

export interface Example {
  slug: string;
  title: string;
  group: string;
  description: string;
  code: string;
  Demo?: ComponentType;
  docHref: string;
  runnable: boolean;
}

export const examples: Example[] = [
  {
    slug: 'basic-form', title: 'Basic form: success and failure', group: 'Actions and forms',
    description: 'Submit a typed form, inspect the pending state, and toggle a simulated server error.',
    docHref: '/docs/forms', runnable: true, Demo: LiveDemo,
    code: `const flow = useSubmitFlow({\n  save: {\n    run: async (input: { name: string }, { signal }) => saveProfile(input, signal),\n    pendingLabel: 'Saving profile…',\n    success: 'Profile saved.',\n    error: 'The example request failed.',\n  },\n})\n\n<SubmitFlowForm flow={flow} defaultAction="save"\n  getInput={{ save: (data) => ({ name: String(data.get('name') ?? '') }) }}>\n  <input name="name" required />\n  <SubmitButton action="save">Save changes</SubmitButton>\n</SubmitFlowForm>`,
  },
  {
    slug: 'multi-action', title: 'Multiple actions', group: 'Actions and forms',
    description: 'Give save and publish separate inputs, pending labels, confirmations, and outcomes.',
    docHref: '/docs/api/use-submit-flow', runnable: true, Demo: LiveDemo,
    code: `const flow = useSubmitFlow({\n  save: { run: saveDraft, pendingLabel: 'Saving…' },\n  publish: {\n    run: publishDraft,\n    confirm: { title: 'Publish this draft?' },\n    pendingLabel: 'Publishing…',\n  },\n})`,
  },
  {
    slug: 'delete-confirmation', title: 'Destructive confirmation', group: 'Actions and forms',
    description: 'Require explicit confirmation before running a destructive action.',
    docHref: '/docs/dialogs', runnable: true, Demo: DeleteDemo,
    code: `const flow = useSubmitFlow({\n  remove: {\n    run: ({ id }) => deleteRecord(id),\n    confirm: {\n      title: 'Delete this record?',\n      description: 'This cannot be undone.',\n      destructive: true,\n      confirmLabel: 'Delete',\n    },\n  },\n})`,
  },
  {
    slug: 'cancel-request', title: 'Cancel an abort-aware request', group: 'Actions and forms',
    description: 'Pass the signal to work that supports abort and keep the flow busy until it settles.',
    docHref: '/docs/concepts/cancellation', runnable: true, Demo: CancelRequestDemo,
    code: `run: async (_input, { signal }) => {\n  const response = await fetch('/api/import', { signal })\n  if (!response.ok) throw new Error('Import failed')\n  return response.json()\n}`, 
  },
  {
    slug: 'cancel-back-navigation', title: 'Cancel and back navigation', group: 'Actions and forms',
    description: 'Keep navigation callbacks explicit and avoid accidental form submission.',
    docHref: '/docs/api/components', runnable: true, Demo: NavigationDemo,
    code: `<CancelButton onCancel={returnToList}>Cancel</CancelButton>\n<BackButton onBack={() => router.back()}>Back</BackButton>`,
  },
  {
    slug: 'chained-steps', title: 'Sequential steps', group: 'Actions and forms',
    description: 'Await related steps in one runner for one lock and one final result.',
    docHref: '/docs/concepts/chaining', runnable: true, Demo: ChainedStepsDemo,
    code: `run: async (input, { signal, throwIfCancelled }) => {\n  const record = await createRecord(input, { signal })\n  throwIfCancelled()\n  await sendNotice(record.id, { signal })\n  return record\n}`, 
  },
  {
    slug: 'independent-flows', title: 'Independent forms', group: 'Actions and forms',
    description: 'Use one provider while each form keeps its own busy state and result.',
    docHref: '/docs/concepts/flow-lifecycle', runnable: true, Demo: IndependentFlowsDemo,
    code: `function DraftForm() {\n  const flow = useSubmitFlow({ save: { run: saveDraft } })\n  return <SubmitFlowRoot flow={flow}>…</SubmitFlowRoot>\n}\n\nfunction PreviewForm() {\n  const flow = useSubmitFlow({ preview: { run: buildPreview } })\n  return <SubmitFlowRoot flow={flow}>…</SubmitFlowRoot>\n}`,
  },
  {
    slug: 'nested-dialog-confirmation', title: 'Confirmation from a dialog form', group: 'Integrations',
    description: 'See the composition pattern and its focus-management caveats when a form is already inside a modal.',
    docHref: '/docs/dialogs', runnable: false,
    code: `// Place the flow under the same provider as the parent dialog.\n// Verify focus restoration and Escape behavior in your modal stack.\nconst accepted = await feedback.confirm({\n  title: 'Save these changes?',\n  outsidePress: false,\n})`,
  },
  {
    slug: 'rhf-validation', title: 'React Hook Form validation', group: 'Integrations',
    description: 'Run the async flow only after React Hook Form accepts the values.',
    docHref: '/docs/integrations/react-hook-form', runnable: false,
    code: `const submit = form.handleSubmit(async (values) => {\n  const result = await flow.run('save', values)\n  if (result.status === 'success') form.reset()\n})`,
  },
  {
    slug: 'tanstack-mutation', title: 'TanStack Query mutation', group: 'Integrations',
    description: 'Await mutateAsync and let the application choose a single feedback owner.',
    docHref: '/docs/integrations/tanstack-query', runnable: false,
    code: `save: {\n  run: async (input) => {\n    const saved = await mutation.mutateAsync(input)\n    await queryClient.invalidateQueries({ queryKey: ['profile'] })\n    return saved\n  },\n  feedback: 'none', // if the mutation already notifies\n}`, 
  },
  {
    slug: 'server-function', title: 'Next.js Server Function', group: 'Integrations',
    description: 'Call a server function from a client flow and map domain failures to safe messages.',
    docHref: '/docs/integrations/next-server-functions', runnable: false,
    code: `save: {\n  run: async (input) => {\n    const result = await saveProfile(input)\n    if (!result.ok) throw new Error(result.code)\n    return result.profile\n  },\n  error: mapSafeMessage,\n}`, 
  },
  {
    slug: 'headless-ui', title: 'Headless custom controls', group: 'Customization',
    description: 'Render state yourself and import the hook from the headless entry.',
    docHref: '/docs/api/headless-and-adapters', runnable: true, Demo: HeadlessDemo,
    code: `import { useSubmitFlow } from 'react-submit-flow/headless'\n\n<button disabled={flow.isBusy} onClick={() => void flow.run('save', input)}>\n  {flow.isBusy ? 'Saving…' : 'Save'}\n</button>`,
  },
  {
    slug: 'standalone-dialogs', title: 'Standalone confirm and alert', group: 'Dialogs and feedback',
    description: 'Ask for confirmation or acknowledgement outside a form.',
    docHref: '/docs/api/provider-and-feedback', runnable: true, Demo: DialogDemo,
    code: `const confirmed = await feedback.confirm({\n  title: 'Remove this draft?',\n  destructive: true,\n})\nif (confirmed) await removeDraft()\n\nconst result = await feedback.alert({ title: 'Export ready' })`,
  },
  {
    slug: 'dialog-options', title: 'Dialog variants and sizes', group: 'Dialogs and feedback',
    description: 'Try the supported variants and responsive sizes in the built-in dialog.',
    docHref: '/docs/dialogs', runnable: true, Demo: DialogOptionsDemo,
    code: `await feedback.confirm({\n  title: 'Continue?',\n  variant: 'warning',\n  size: 'md',\n  closeOnEscape: true,\n  outsidePress: false,\n})`,
  },
  {
    slug: 'retained-confirmation', title: 'Retained confirmation and error', group: 'Dialogs and feedback',
    description: 'Keep the dialog open during execution and show an error without retrying.',
    docHref: '/docs/dialogs', runnable: true, Demo: RetainedErrorDemo,
    code: `publish: {\n  run: publishDraft,\n  confirm: { title: 'Publish now?' },\n  closeOnConfirm: false,\n  pendingLabel: 'Publishing…',\n}`, 
  },
  {
    slug: 'theme-rtl', title: 'Theme tokens and RTL', group: 'Customization',
    description: 'Use optional theme presets or inherit right-to-left text direction.',
    docHref: '/docs/styling', runnable: true, Demo: ThemeRtlDemo,
    code: `import 'react-submit-flow/styles.css'\nimport 'react-submit-flow/themes/forest.css'\n\n<html data-theme="forest">\n  <body dir="rtl">…</body>\n</html>`,
  },
];

export const exampleGroups = [...new Set(examples.map((example) => example.group))].map((title) => ({
  title,
  items: examples.filter((example) => example.group === title),
}));
