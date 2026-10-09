# react-submit-flow

Coordinate async actions with typed pending, success, error, cancellation, accessible confirmations, and notifications. It works alongside native forms and existing form libraries.

## Install

```sh
pnpm add react-submit-flow react react-dom
```

## Next.js setup

```tsx
// app/providers.tsx
'use client'
import { SubmitFlowProvider } from 'react-submit-flow'

export function Providers({ children }: { children: React.ReactNode }) {
  return <SubmitFlowProvider>{children}</SubmitFlowProvider>
}
```

```tsx
// app/layout.tsx — import optional default styles here
import 'react-submit-flow/styles.css'
import { Providers } from './providers'

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return <html lang="en"><body><Providers>{children}</Providers></body></html>
}
```

## Add a typed flow

```tsx
'use client'
import { SubmitButton, SubmitFlowForm, useSubmitFlow } from 'react-submit-flow'

export function ProfileForm() {
  const flow = useSubmitFlow({
    save: {
      run: async (profile: { name: string }) => {
        const response = await fetch('/api/profile', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(profile),
        })
        if (!response.ok) throw new Error('Could not save the profile.')
        return response.json() as Promise<{ id: string }>
      },
      pendingLabel: 'Saving…',
      success: 'Profile saved.',
    },
  })

  return <SubmitFlowForm flow={flow} defaultAction="save"
    getInput={{ save: (data) => ({ name: String(data.get('name') ?? '') }) }}>
    <label>Name <input name="name" required /></label>
    <SubmitButton action="save">Save profile</SubmitButton>
  </SubmitFlowForm>
}
```

The `run` callback owns transport and validation. Throw when a response represents a failure; `fetch` does not throw for non-2xx responses. A confirmation can be added with `confirm: { title, description, destructive: true }`. Set `closeOnConfirm: false` on the action to keep the dialog open while it runs.

## Standalone dialogs

```tsx
'use client'
import { useSubmitFeedback } from 'react-submit-flow'

export function RemoveButton() {
  const feedback = useSubmitFeedback()
  return <button type="button" onClick={async () => {
    const confirmed = await feedback.confirm({
      title: 'Delete this item?',
      description: 'You cannot undo this action.',
      destructive: true,
    })
    if (confirmed) await removeItem()
  }}>Delete</button>
}
```

`confirm()` returns `true` only when accepted. `alert()` returns `acknowledged` or a dismissal reason. These dialogs require `SubmitFlowProvider`.

## Headless usage

Import `useSubmitFlow` from `react-submit-flow/headless` to render your own buttons, status, and feedback. This entry does not load the provider UI, Radix dialogs, React DOM, or the optional CSS. Provide confirmation and notification adapters when a headless action uses those features.

## Styling

The built-in feedback UI works without the optional theme. Import `react-submit-flow/styles.css` for focus rings, variant colors, motion, and customizable `--sf-*` tokens. Optional presets are `react-submit-flow/themes/forest.css` and `react-submit-flow/themes/high-contrast.css`; import the preset you want and set `data-theme="forest"` or `data-theme="high-contrast"` on the root `<html>` element. Both support light and dark color schemes. Dialogs expose `data-variant`, `data-size`, and `data-state` for custom CSS.

## Development

From the monorepo root, run `pnpm dev` for the Next.js site and Vite package watcher, or `pnpm build` to build the package and site.
