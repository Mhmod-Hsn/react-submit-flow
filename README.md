# react-submit-flow

Typed async action flows for React forms and buttons, with coordinated pending states, confirmations, cancellation, and feedback.

**Description:** A typed React library for coordinating async form actions, confirmations, cancellation, and accessible feedback.

**Tags:** `react` · `typescript` · `react-library` · `async-actions` · `form-handling` · `vite` · `nextjs` · `accessible-ui` · `headless-ui`

**Website:** [react-submit-flow](https://mhmod-hsn.github.io/react-submit-flow/) · **[Documentation](https://mhmod-hsn.github.io/react-submit-flow/docs/)** · **[Examples](https://mhmod-hsn.github.io/react-submit-flow/examples/)**

The repository is a pnpm workspace containing:

- the published package: [`packages/react-submit-flow`](packages/react-submit-flow)
- the documentation website: [`apps/website`](apps/website)

For package-level installation and consumer-first usage, see the [library README](packages/react-submit-flow/README.md).

## What the library provides vs. what your app owns

| Provided by `react-submit-flow`                          | Still owned by the consuming app                  |
| -------------------------------------------------------- | ------------------------------------------------- |
| Typed named action orchestration (`useSubmitFlow`)       | Form field registration/state management          |
| Busy locking per flow and explicit run results           | Domain validation and business rules              |
| Confirmation lifecycle and retained confirmation support | Transport details (`fetch`, RPC, SDK choices)     |
| Cancellation wiring (`AbortSignal`, `throwIfCancelled`)  | Server-side idempotency/rollback strategy         |
| Built-in provider dialogs, queueing, and toast host      | Routing, cache invalidation, optimistic updates   |
| Optional UI components and optional CSS/themes           | App-level design system and accessibility reviews |

## Requirements

- Node.js 20.19 or newer
- pnpm 10.26.2 (managed through Corepack or your package manager)

## Get started

```sh
pnpm install
pnpm dev
```

`pnpm dev` builds the package, starts a Vite package watcher, waits for package output, and then runs the Next.js website.

## Workspace commands

| Command              | Purpose                                                            |
| -------------------- | ------------------------------------------------------------------ |
| `pnpm dev`           | Build the package, watch library changes, and run the website.     |
| `pnpm build`         | Build the library and the production website.                      |
| `pnpm build:package` | Build the Vite package and declarations.                           |
| `pnpm build:website` | Build the Next.js website.                                         |
| `pnpm typecheck`     | Emit package declarations, then typecheck the library and website. |
| `pnpm lint`          | Lint library and website source.                                   |
| `pnpm check`         | Run typecheck, lint, and production builds.                        |
| `pnpm test`          | Run package tests (currently a placeholder script).                |
| `pnpm test:e2e`      | Run website e2e tests (currently a placeholder script).            |
| `pnpm check:package` | Inspect files included in the npm package.                         |

If you run the website alone, build the workspace package first:

```sh
pnpm build:package
pnpm --filter @react-submit-flow/website dev
```

## Technology stack and workspace model

- **Monorepo:** pnpm workspace (`pnpm-workspace.yaml`) with `packages/*` and `apps/*`
- **Library:** React + TypeScript, built with Vite and `tsc`
- **Website:** Next.js App Router + MDX, statically exported for GitHub Pages
- **Quality gates:** ESLint + TypeScript checks + CI workflows
- **Package distribution:** ESM package exports (`.` + `./headless` + CSS subpaths)

## Repository architecture

### Top-level structure

| Path                          | Role                                                                       |
| ----------------------------- | -------------------------------------------------------------------------- |
| `apps/website/`               | Docs + examples site that consumes the workspace package.                  |
| `packages/react-submit-flow/` | Publishable library source, types, CSS, themes, and package build scripts. |
| `.github/workflows/`          | CI validation and GitHub Pages deployment workflows.                       |
| `package.json`                | Root orchestration scripts across package + website.                       |
| `pnpm-workspace.yaml`         | Workspace package discovery.                                               |
| `pnpm-lock.yaml`              | Locked dependency graph for reproducible installs.                         |
| `tsconfig.base.json`          | Shared TypeScript compiler baseline.                                       |
| `eslint.config.mjs`           | Shared lint rules for TypeScript sources.                                  |

### Website (`apps/website`)

- `app/`: Next.js routes (`/docs`, `/examples`, root pages)
- `content/docs/`: MDX source for documentation sections
- `components/`, `lib/`, `mdx-components.tsx`: site rendering and MDX plumbing
- `next.config.mjs`: static export setup + GitHub Pages basePath handling

### Library (`packages/react-submit-flow`)

- `src/index.tsx`: main UI entry (provider, hooks, components, public types)
- `src/headless.ts`: headless entry (`useSubmitFlow` + types only)
- `src/core/controller.ts`: runtime state machine and action orchestration core
- `src/components/components.tsx`: form/control primitives
- `src/feedback/provider.tsx`: native `<dialog>` host, queueing, toasts
- `src/types.ts`: canonical public types (`FlowStatus`, `RunResult`, action contracts)
- `src/styles.css`, `src/themes/*`: optional default styling and theme presets
- `scripts/clean.mjs`, `scripts/copy-css.mjs`: build helpers for `dist/`

### Workflows (`.github/workflows`)

- `ci.yml`: checkout, install, lint, typecheck, build, package-content verification
- `deploy-pages.yml`: static website build + artifact upload + Pages deployment

## Runtime architecture and flow execution

A single `useSubmitFlow(actions, options)` call creates one independent flow instance backed by `FlowController`.

```text
React event (submit/click)
  -> useSubmitFlow().run(action, input)
    -> FlowController.run(...)
      -> optional confirm step (provider or adapter)
      -> action.run(input, context)
      -> map to RunResult (success/error/cancelled/skipped)
      -> provider/adapters feedback (toast/inline/none)
      -> consumer handles typed result
```

### `FlowStatus` values and normal transitions

`FlowStatus`: `idle | confirming | pending | cancelling | success | error | cancelled`

```text
idle -> confirming -> pending -> success | error
idle -> pending -> cancelling -> cancelled
confirming -> cancelled (declined or dismissed)
```

`isBusy` stays `true` during confirm/pending/cancelling cleanup. If another run starts while busy, `run()` resolves as `{ status: 'skipped', reason: 'busy' }`.

### Why `src/core/controller.ts` is central

`packages/react-submit-flow/src/core/controller.ts` owns the runtime contract:

- resolves action lookups and rejects unknown action names
- creates per-run `AbortController` and `runId`
- applies confirmation + retained-confirmation logic
- manages status snapshots consumed by React via `useSyncExternalStore`
- resolves discriminated results (`success`/`error`/`cancelled`/`skipped`)
- dispatches feedback through provider bridge or adapters
- executes observers (`onSuccess`, `onError`, `onCancel`) safely

## Actions, typing, and result model

`ActionDefinition<Input, Output>` drives inference:

```ts
const flow = useSubmitFlow({
  save: {
    run: async (input: { name: string }) => ({ id: "1", name: input.name }),
  },
});

const result = await flow.run("save", { name: "Ada" });
// result narrows by status; on success, result.data is typed from run() output.
```

- Action names are inferred from object keys.
- Inputs are inferred per action for `run(action, input)`.
- Outputs are inferred per action and surfaced in success variants.

`RunResult` variants:

- `{ status: 'success'; action; data; runId }`
- `{ status: 'error'; action; error; runId }`
- `{ status: 'cancelled'; action; reason: 'declined' | 'user' | 'unmounted'; runId }`
- `{ status: 'skipped'; reason: 'busy' }`

## Cancellation model (cooperative by design)

Every `run` receives `context.signal` and `context.throwIfCancelled()`.

- **`AbortSignal`** tells abort-aware APIs (for example `fetch`) to stop pending work.
- **`throwIfCancelled()`** is for boundaries between sequential side effects.

```tsx
run: async (input, context) => {
  const draft = await saveDraft(input, { signal: context.signal });
  context.throwIfCancelled();
  return publishDraft(draft.id, { signal: context.signal });
};
```

Cancellation is cooperative: aborting cannot undo already-completed external writes, so the flow stays busy until the runner settles and then resolves `cancelled`.

## Confirmations and retained confirmations

An action can define `confirm` as:

- static options object, or
- function `(input) => ConfirmOptions` for dynamic confirmations

`closeOnConfirm` determines whether the confirmation closes immediately after user acceptance:

- `true` (default behavior): close then execute
- `false`: retain dialog through `pending` / `cancelling` / `error` phases

Precedence for `closeOnConfirm`:

1. `action.closeOnConfirm`
2. `action.confirm.closeOnConfirm`
3. `SubmitFlowProvider` `dialogDefaults.closeOnConfirm`
4. fallback `true`

For retained behavior with adapters, implement `adapters.retainedConfirmation` (not only `adapters.confirm`).

## Provider architecture, dialog queue, and toasts

`SubmitFlowProvider` installs a `FeedbackStore` bridge that:

- queues dialog requests and shows one active dialog at a time
- supports confirmation and alert requests (`useSubmitFeedback`) across owners
- renders native `<dialog>` for built-in confirmations/alerts
- hosts shared toast notifications per provider instance

Toast behavior:

- non-error toasts auto-dismiss (`toastDuration`, default `5000` ms)
- error toasts persist until dismissed
- visible toast count is capped (`maxVisibleToasts`, default `3`)
- hover/focus pauses auto-dismiss timers

## Forms and controls

- **`SubmitFlowForm`**: native `<form>` wrapper, `defaultAction`, and typed `getInput` mapping from `FormData`
- **`SubmitFlowRoot`**: context-only wrapper for non-form action groups
- **`SubmitButton`**: submit button tied to `data-sf-action`
- **`ActionButton`**: direct action trigger with optional explicit input
- **`CancelButton`**: requests cancellation when busy, falls back to `onCancel` when idle
- **`BackButton`**: executes `onBack`, disabled while busy
- **`SubmitFeedback`**: inline pending/result feedback surface with render customization

## Headless usage and adapters

Use `react-submit-flow/headless` when bringing your own UI:

- exports `useSubmitFlow` and execution types
- does not import built-in provider UI or CSS
- can run actions without provider if no built-in confirm/alert is needed

Adapters allow integration with existing dialog/toast stacks:

- `adapters.confirm`
- `adapters.alert`
- `adapters.retainedConfirmation`
- `adapters.notifications`

## Standalone dialogs and alerts (`useSubmitFeedback`)

`useSubmitFeedback()` (inside `SubmitFlowProvider`) provides:

- `confirm(options) -> Promise<boolean>`
- `alert(options) -> Promise<{ status: 'acknowledged' } | { status: 'dismissed'; reason }>`

This is useful for non-flow interactions that still need consistent provider-backed dialogs.

## Accessibility behavior

Built-in UI includes:

- semantic dialog roles (`dialog` / `alertdialog`) and `aria-modal`
- labelled dialog title/description wiring
- `role="status"` or `role="alert"` + polite/assertive `aria-live` for feedback and toasts
- keyboard dismissal handling based on dialog policy (`closeOnEscape`, retained phase rules)
- focus-aware toast timing pause/resume

Accessibility remains a shared responsibility: verify adapter-based implementations and app-level compositions in your product context.

## Styling and themes

CSS is optional but recommended for polished defaults.

```tsx
import "react-submit-flow/styles.css";
import "react-submit-flow/themes/forest.css"; // optional preset
// or: import 'react-submit-flow/themes/high-contrast.css'
```

Public style entry points:

- `react-submit-flow/styles.css`
- `react-submit-flow/themes/forest.css`
- `react-submit-flow/themes/high-contrast.css`

## Public entry points

| Import path                  | Exports                                                                                 |
| ---------------------------- | --------------------------------------------------------------------------------------- |
| `react-submit-flow`          | `useSubmitFlow`, `useSubmitFeedback`, `SubmitFlowProvider`, UI components, public types |
| `react-submit-flow/headless` | headless `useSubmitFlow` + flow/action types                                            |
| CSS subpaths                 | default stylesheet + theme presets                                                      |

## Package build process

`packages/react-submit-flow/package.json` build pipeline:

1. `scripts/clean.mjs` removes `dist/`
2. `tsc -p tsconfig.build.json` emits declarations
3. `vite build` emits JS bundles
4. `scripts/copy-css.mjs` copies `styles.css` and theme files to `dist/`

## Development workflow

From repository root:

```sh
pnpm install
pnpm dev
pnpm typecheck
pnpm lint
pnpm build
pnpm check
```

Before opening a contribution, run:

```sh
pnpm check
```

## Integrations

Common patterns documented and exercised in the website examples/docs:

- React Hook Form
- TanStack Query
- Next.js Server Functions
- Custom dialog/toast systems via adapters

## Project considerations and strengths

### Considerations

- Cancellation is cooperative; it is not rollback.
- Built-in dialogs use native `<dialog>`; validate interoperability if your app already uses another modal stack.
- Package and website test scripts are placeholders today; CI relies on lint/typecheck/build/package checks.

### Strengths

- Strong TypeScript inference around action names/inputs/outputs
- Explicit result union instead of implicit promise error channels
- Composable architecture: built-in UI for speed, headless entry for customization
- Clear separation between flow orchestration and application business logic

## Contributing

- Keep changes scoped and typed.
- Prefer updating docs/examples alongside behavior changes.
- Use the website (`apps/website`) to validate docs and interactive behavior.

## License

MIT. See [`packages/react-submit-flow/LICENSE`](packages/react-submit-flow/LICENSE).
