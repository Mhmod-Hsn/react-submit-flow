# react-submit-flow

Typed async action flows for React forms and buttons, with coordinated pending states, confirmations, cancellation, and feedback.

**Description:** A typed React library for coordinating async form actions, confirmations, cancellation, and accessible feedback.

**Tags:** `react` · `typescript` · `react-library` · `async-actions` · `form-handling` · `vite` · `nextjs` · `accessible-ui` · `headless-ui`

**Website:** [react-submit-flow](https://mhmod-hsn.github.io/react-submit-flow/) · **[Documentation](https://mhmod-hsn.github.io/react-submit-flow/docs/)** · **[Examples](https://mhmod-hsn.github.io/react-submit-flow/examples/)**

The repository is a pnpm workspace containing the library package and its Next.js website. For consumer installation, the API, and usage guidance, see the [library README](packages/react-submit-flow/README.md).

## Requirements

- Node.js 20.19 or newer
- pnpm 10.26.2 (managed through Corepack or your package manager)

## Get started

```sh
pnpm install
pnpm dev
```

The development command builds the package, then starts the Vite package watcher and Next.js website. Open the local URL printed by Next.js to browse the docs and live examples.

## Workspace commands

| Command | Purpose |
| --- | --- |
| `pnpm dev` | Build the package, watch library changes, and run the website. |
| `pnpm build` | Build the library and the production website. |
| `pnpm build:package` | Build the Vite package and declarations. |
| `pnpm build:website` | Build the Next.js website. |
| `pnpm typecheck` | Emit package declarations, then typecheck the library and website. |
| `pnpm lint` | Lint library and website source. |
| `pnpm check` | Run typecheck, lint, and production builds. |
| `pnpm check:package` | Inspect the files included in the npm package. |

The website consumes the workspace package through its public exports. Build the package before running the website by itself:

```sh
pnpm build:package
pnpm --filter @react-submit-flow/website dev
```

## Repository layout

```text
apps/website/                    Next.js site, MDX docs, and live examples
packages/react-submit-flow/      Vite-built React package
docs/IMPLEMENTATION_PLAN.md      Product scope, architecture, and release checklist
```

The library is under active development. The implementation plan tracks features and release gates that are still in progress.

## Contributing

Before opening a change, run:

```sh
pnpm check
```

See the [implementation plan](docs/IMPLEMENTATION_PLAN.md) for the intended API, scope, architecture, and remaining acceptance work.
