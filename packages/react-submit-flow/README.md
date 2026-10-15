# react-submit-flow

Typed async actions for React forms and buttons, with coordinated pending states, confirmations, cancellation, and feedback.

[Website](https://mhmod-hsn.github.io/react-submit-flow/) · [Documentation](https://mhmod-hsn.github.io/react-submit-flow/docs/) · [Examples](https://mhmod-hsn.github.io/react-submit-flow/examples/)

`react-submit-flow` handles the lifecycle around an async action. Your app keeps ownership of fields, validation, transport, routing, and cache updates. Use the built-in components and provider for a quick setup, or import the headless hook and render the entire experience yourself.

> **Version 0.1.0:** the public API is in active development. The built-in dialog uses the browser's native `<dialog>`. Compatibility with nested dialogs from other UI libraries has not been verified; use an adapter for an existing modal stack.

## What you get

- **Typed named actions:** infer action names, inputs, and resolved output types from one action map.
- **One flow per form or action group:** prevent duplicate calls in the same flow while unrelated flows continue independently.
- **Explicit results:** success, failure, cancellation, and skipped calls are represented as a discriminated union.
- **Form-friendly controls:** preserve native browser validation, Enter submission, and submitter-based action selection.
- **Optional confirmations:** ask before an action, including destructive actions, or keep the confirmation visible during execution.
- **Cancellation:** pass an `AbortSignal` into work and keep the flow busy until the runner settles.
- **Shared feedback:** show provider-managed notifications, standalone confirmations, and acknowledgement dialogs.
- **Bring your own UI:** use `react-submit-flow/headless` and supply adapters for confirmation and notifications.
- **Optional CSS:** the built-in UI works without a theme import; default styles and two theme presets are available as CSS subpaths.

## Install

```sh
npm install react-submit-flow react react-dom
# or
pnpm add react-submit-flow react react-dom
# or
yarn add react-submit-flow react react-dom
```

React and React DOM are peer dependencies. The package supports React 18.2 and React 19. The built-in provider currently uses native browser dialog behavior.

## Quick start

### 1. Add the provider

The provider is required for built-in confirmation and alert dialogs and shared notifications. In Next.js App Router, put it in a client component and render that component from the root layout.

```tsx
// app/providers.tsx
"use client";

import { SubmitFlowProvider } from "react-submit-flow";

export function Providers({ children }: { children: React.ReactNode }) {
  return <SubmitFlowProvider>{children}</SubmitFlowProvider>;
}
```

```tsx
// app/layout.tsx
import "react-submit-flow/styles.css"; // optional
import { Providers } from "./providers";

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
```

### 2. Define a flow and use it in a form

```tsx
"use client";

import { SubmitButton, SubmitFlowForm, useSubmitFlow } from "react-submit-flow";

type Profile = { id: string; name: string };

export function ProfileForm() {
  const flow = useSubmitFlow({
    save: {
      run: async (input: { name: string }, { signal }): Promise<Profile> => {
        const response = await fetch("/api/profile", {
          method: "POST",
          signal,
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(input),
        });
        if (!response.ok) throw new Error("Profile request failed");
        return response.json() as Promise<Profile>;
      },
      pendingLabel: "Saving…",
      success: (profile) => `Saved ${profile.name}.`,
      error: "We could not save your profile.",
    },
  });

  return (
    <SubmitFlowForm
      flow={flow}
      defaultAction="save"
      getInput={{ save: (data) => ({ name: String(data.get("name") ?? "") }) }}
    >
      <label>
        Name
        <input name="name" required />
      </label>
      <SubmitButton action="save">Save profile</SubmitButton>
    </SubmitFlowForm>
  );
}
```

`fetch()` does not reject for HTTP 4xx or 5xx responses. Check `response.ok` and throw or map the response to your own result type.

## How a flow works

Each `useSubmitFlow()` call creates an independent flow. It tracks its own active action, status, result, and feedback. A provider can serve multiple flows without serializing their async work.

```text
idle → confirming → pending → success | error
idle → pending → cancelling → cancelled
confirming → cancelled (declined or dismissed)
```

Calls made while the same flow is busy resolve as `skipped`. Expected runner failures resolve as `error`; they do not reject the promise. Unknown action names and invalid setup are programming errors and can throw before the runner starts.

```tsx
const result = await flow.run("save", { name: "Ada" });

switch (result.status) {
  case "success":
    // result.data is inferred from the save runner.
    console.log(result.data.id);
    break;
  case "error":
    reportError(result.error);
    break;
  case "cancelled":
    // The user declined or cancelled; this is not an action failure.
    break;
  case "skipped":
    // Another action in this flow is already active.
    break;
}
```

The runner receives an `AbortSignal`. Cancellation requests are cooperative: pass the signal to APIs that support abort, and call `throwIfCancelled()` between sequential side effects. The flow stays busy until the runner settles. Aborting a request does not undo work already completed on the server.

## Multiple actions

Actions in the same flow share one busy lock but keep their own input/output types and labels.

```tsx
const flow = useSubmitFlow({
  save: {
    run: async (input: { title: string }) => saveDraft(input),
    pendingLabel: "Saving draft…",
    success: "Draft saved.",
  },
  publish: {
    run: async (input: { id: string }) => publishDraft(input.id),
    confirm: {
      title: "Publish this draft?",
      description: "Readers will be able to see it.",
      confirmLabel: "Publish",
    },
    pendingLabel: "Publishing…",
    closeOnConfirm: false,
  },
});

await flow.run("save", { title: "Release notes" });
await flow.run("publish", { id: "draft-42" });
```

Use `ActionButton` for a named action outside a form, or `SubmitButton` inside `SubmitFlowForm`.

## Forms and components

### `SubmitFlowForm`

Renders one native form and provides its flow to child controls. `defaultAction` handles Enter-key submission when there is no submitter. `getInput` maps each action name to a synchronous converter from `FormData` and the submitting element.

Browser constraint validation runs before submission. Conversion errors are shown inline and do not become action results. The component does not register fields, reset values automatically, or replace a form library.

### `SubmitFlowRoot`

Provides a flow to components around an existing form or non-form action group without adding a wrapper element.

### Buttons

| Component      | Behavior                                                                  |
| -------------- | ------------------------------------------------------------------------- |
| `SubmitButton` | Native submit button; selects its action through the form submit event.   |
| `ActionButton` | Runs a named action directly; pass `input` when the action requires one.  |
| `CancelButton` | Requests cancellation while busy; calls `onCancel` while idle.            |
| `BackButton`   | Calls the required `onBack` callback and disables while the flow is busy. |

The buttons accept native button attributes and forward refs. The library controls the button type and effective busy state.

### `SubmitFeedback`

Renders the flow's pending or feedback message inline, or accepts children/a render function for custom content. Toast and inline feedback should not both announce the same result in your UI.

## Action configuration

An action has this shape:

```ts
{
  run(input, context),
  confirm?,
  pendingLabel?,
  success?,
  error?,
  feedback?, // 'toast' | 'inline' | 'none'
  closeOnConfirm?,
  onSuccess?,
  onError?,
  onCancel?,
}
```

- `run(input, context)` can return a value or a promise. `context` includes `signal`, `runId`, `action`, and `throwIfCancelled()`.
- `confirm` is a dialog options object or a function that derives options from the input.
- `success` and `error` accept plain text or a formatter. Default errors use generic text; map sensitive server errors to safe messages.
- `feedback` routes result messages to provider notifications, flow feedback, or nowhere. Retained dialogs continue to show their own pending/error state.
- `onSuccess`, `onError`, and `onCancel` are observers. Observer errors do not change the execution result.
- `closeOnConfirm: false` keeps the built-in action dialog open through execution. On failure, it displays the error and offers Close; it never retries automatically.

To make retained confirmations the provider-wide default, set `dialogDefaults={{ closeOnConfirm: false }}` on `SubmitFlowProvider`. An action's top-level `closeOnConfirm`, then its confirmation option, overrides the provider default. While running, the confirm button stays visible and disabled with the pending label. A custom adapter needs `retainedConfirmation` for this behavior.

`FlowOptions` accepts `successMessage`, `errorMessage`, `adapters`, and `onObserverError`.

## Confirmations and standalone dialogs

Add `confirm` to an action to ask before running it:

```tsx
remove: {
  run: async ({ id }) => deleteRecord(id),
  confirm: {
    title: 'Delete this record?',
    description: 'This cannot be undone.',
    destructive: true,
    confirmLabel: 'Delete',
  },
}
```

Supported dialog options include `title`, `description`, trusted React `content`, `variant`, `size`, `width`, `confirmLabel`, `cancelLabel`, `destructive`, `closeOnEscape`, and `outsidePress`. Variants are `neutral`, `danger`, `warning`, `success`, and `info`; sizes are `sm`, `md`, and `lg`. Escape dismisses by default. Outside click is disabled unless explicitly enabled; it never confirms.

Use `useSubmitFeedback()` for a dialog outside a flow or form:

```tsx
"use client";

import { useSubmitFeedback } from "react-submit-flow";

export function RemoveButton() {
  const feedback = useSubmitFeedback();

  return (
    <button
      type="button"
      onClick={async () => {
        const accepted = await feedback.confirm({
          title: "Delete this item?",
          description: "This action cannot be undone.",
          destructive: true,
          confirmLabel: "Delete item",
        });
        if (accepted) await removeItem();
      }}
    >
      Delete
    </button>
  );
}
```

`confirm()` returns `true` only on explicit confirmation. `alert()` returns `{ status: 'acknowledged' }` or `{ status: 'dismissed', reason }`. Both require `SubmitFlowProvider`. Do not assume the built-in native dialog integrates with another library's modal stack; use an adapter and verify that integration in your app.

## Provider notifications

The provider renders shared notifications. Success messages time out after five seconds by default; errors stay until dismissed. `maxVisibleToasts` controls how many messages are visible, and `className` applies to the shared notification host.

```tsx
<SubmitFlowProvider
  toastDuration={5000}
  maxVisibleToasts={3}
  dialogDefaults={{ size: "md", closeOnEscape: true }}
  dir="rtl"
>
  {children}
</SubmitFlowProvider>
```

Each provider instance owns an isolated dialog queue and notification host. If you already have a notification system, supply `adapters.notifications` to an action flow.

## Headless usage and adapters

Import the hook and types from `react-submit-flow/headless` to render all controls and feedback yourself. This entry does not load the built-in provider UI or CSS. Actions without confirmations can run without a provider.

```tsx
"use client";

import { useSubmitFlow } from "react-submit-flow/headless";

export function CustomSave() {
  const flow = useSubmitFlow({
    save: { run: async (input: { title: string }) => saveDraft(input) },
  });

  return (
    <div>
      <button disabled={flow.isBusy} onClick={() => void flow.run("save", { title: "Draft" })}>
        {flow.isBusy ? "Saving…" : "Save"}
      </button>
      <span role="status">{flow.feedback?.message ?? flow.status}</span>
    </div>
  );
}
```

Provide adapters for custom confirmation and notification behavior:

```tsx
const flow = useSubmitFlow(actions, {
  adapters: {
    confirm: (request, { signal }) => myDialog.confirm(request, { signal }),
    notifications: {
      notify: (message) => toast(message.message),
      dismiss: (messageId) => toast.dismiss(messageId),
    },
  },
});
```

For `closeOnConfirm: false`, provide `retainedConfirmation` rather than a simple yes/no `confirm` adapter. The retained adapter supplies `decision`, `closed`, `update`, and `close` so it can show pending, cancelling, and error states.

## Styling and themes

The built-in UI includes minimal inline layout styles, so importing CSS is optional. Add the default stylesheet for focus rings, variants, and theme tokens:

```tsx
import "react-submit-flow/styles.css";
```

Optional presets can follow the default stylesheet:

```tsx
import "react-submit-flow/styles.css";
import "react-submit-flow/themes/forest.css";
// or: import 'react-submit-flow/themes/high-contrast.css'
```

Select a preset on the root element:

```html
<html data-theme="forest"></html>
```

The presets follow the system color scheme and support an explicit `data-color-mode="dark"` on the root element for apps with a manual theme toggle. The UI exposes `sf-*` class names and `data-state`, `data-variant`, and `data-size` attributes. Override tokens such as `--sf-accent`, `--sf-danger`, `--sf-dialog-sm`, `--sf-dialog-md`, and `--sf-dialog-lg`. The provider-rendered UI inherits the page's `dir`; set `dir="rtl"` on `SubmitFlowProvider` when it serves an RTL subtree inside an LTR page. See the [RTL example](/examples/theme-rtl).

## Integrations

The library can be used with other tools without taking over their responsibilities:

- **React Hook Form:** keep validation in `handleSubmit`; call `flow.run()` only for valid values.
- **Zod or another schema tool:** validate before starting the flow and map domain errors in your app.
- **TanStack Query:** await `mutateAsync()` in `run`; keep invalidation and retry policy in the query layer.
- **Next.js Server Functions:** call the server function from a client action and explicitly map returned domain errors. `AbortSignal` does not cross the server boundary automatically.
- **Existing dialogs and toasts:** use adapters and validate focus, dismissal, and notification behavior in your app.

## Public imports

| Import                                       | Contents                                                                      |
| -------------------------------------------- | ----------------------------------------------------------------------------- |
| `react-submit-flow`                          | `useSubmitFlow`, `useSubmitFeedback`, provider, components, and public types. |
| `react-submit-flow/headless`                 | `useSubmitFlow` and execution/adapter types without built-in UI.              |
| `react-submit-flow/styles.css`               | Optional default styles and tokens.                                           |
| `react-submit-flow/themes/forest.css`        | Optional forest preset.                                                       |
| `react-submit-flow/themes/high-contrast.css` | Optional high-contrast preset.                                                |

## Development

This repository is a pnpm workspace. From the repository root:

```sh
pnpm install
pnpm dev       # package watcher + Next.js docs site
pnpm typecheck
pnpm lint
pnpm build
```

The docs and runnable examples live in `apps/website`. The library source and Vite build live in `packages/react-submit-flow`.

## License

MIT. See [LICENSE](./LICENSE).
