import type { ComponentType } from "react";
import Link from "next/link";
import Overview from "../content/docs/overview.mdx";
import GettingStarted from "../content/docs/getting-started.mdx";
import Dependencies from "../content/docs/dependencies-and-bundle-footprint.mdx";
import FlowLifecycle from "../content/docs/concepts/flow-lifecycle.mdx";
import Results from "../content/docs/concepts/results-and-errors.mdx";
import Cancellation from "../content/docs/concepts/cancellation.mdx";
import Chaining from "../content/docs/concepts/chaining.mdx";
import UseSubmitFlow from "../content/docs/api/use-submit-flow.mdx";
import Components from "../content/docs/api/components.mdx";
import Provider from "../content/docs/api/provider-and-feedback.mdx";
import Headless from "../content/docs/api/headless-and-adapters.mdx";
import Forms from "../content/docs/forms.mdx";
import Dialogs from "../content/docs/dialogs.mdx";
import ReactHookForm from "../content/docs/integrations/react-hook-form.mdx";
import TanStackQuery from "../content/docs/integrations/tanstack-query.mdx";
import NextServerFunctions from "../content/docs/integrations/next-server-functions.mdx";
import Styling from "../content/docs/styling.mdx";
import Troubleshooting from "../content/docs/troubleshooting.mdx";

export interface DocPage {
  slug: string;
  title: string;
  description: string;
  Content: ComponentType;
}

export interface DocSection {
  title: string;
  pages: DocPage[];
}

export const docSections: DocSection[] = [
  {
    title: "Start here",
    pages: [
      {
        slug: "overview",
        title: "Overview",
        description: "What the library does and where it fits.",
        Content: Overview,
      },
      {
        slug: "getting-started",
        title: "Getting started",
        description: "Install the package and build a first typed form.",
        Content: GettingStarted,
      },
      {
        slug: "dependencies-and-bundle-footprint",
        title: "Dependencies and bundle",
        description: "Runtime dependencies, peer requirements, and package entry points.",
        Content: Dependencies,
      },
    ],
  },
  {
    title: "Concepts",
    pages: [
      {
        slug: "concepts/flow-lifecycle",
        title: "Flow lifecycle",
        description: "Understand flow ownership, state, and duplicate prevention.",
        Content: FlowLifecycle,
      },
      {
        slug: "concepts/results-and-errors",
        title: "Results and errors",
        description: "Handle typed outcomes and map safe user feedback.",
        Content: Results,
      },
      {
        slug: "concepts/cancellation",
        title: "Cancellation",
        description: "Abort work safely and understand what cancellation means.",
        Content: Cancellation,
      },
      {
        slug: "concepts/chaining",
        title: "Chaining actions",
        description: "Sequence related work without nested flow locks.",
        Content: Chaining,
      },
    ],
  },
  {
    title: "API reference",
    pages: [
      {
        slug: "api/use-submit-flow",
        title: "useSubmitFlow",
        description: "Action definitions, options, state, and typed run results.",
        Content: UseSubmitFlow,
      },
      {
        slug: "api/components",
        title: "Components",
        description: "Forms, roots, buttons, and inline feedback.",
        Content: Components,
      },
      {
        slug: "api/provider-and-feedback",
        title: "Provider and feedback",
        description: "Shared notifications, standalone dialogs, and provider options.",
        Content: Provider,
      },
      {
        slug: "api/headless-and-adapters",
        title: "Headless and adapters",
        description: "Bring your own UI with the headless entry and adapters.",
        Content: Headless,
      },
    ],
  },
  {
    title: "Guides",
    pages: [
      {
        slug: "forms",
        title: "Forms",
        description: "Native form submission, validation, and input mapping.",
        Content: Forms,
      },
      {
        slug: "dialogs",
        title: "Dialogs",
        description: "Confirm, alert, dismiss, and retain dialogs during execution.",
        Content: Dialogs,
      },
      {
        slug: "styling",
        title: "Styling and themes",
        description: "Theme tokens, presets, custom CSS, and RTL.",
        Content: Styling,
      },
    ],
  },
  {
    title: "Integrations",
    pages: [
      {
        slug: "integrations/react-hook-form",
        title: "React Hook Form",
        description: "Keep field validation in RHF and delegate async work to a flow.",
        Content: ReactHookForm,
      },
      {
        slug: "integrations/tanstack-query",
        title: "TanStack Query",
        description: "Use mutateAsync without duplicate notifications.",
        Content: TanStackQuery,
      },
      {
        slug: "integrations/next-server-functions",
        title: "Next.js Server Functions",
        description: "Call server functions from a client-owned flow.",
        Content: NextServerFunctions,
      },
    ],
  },
  {
    title: "Help",
    pages: [
      {
        slug: "troubleshooting",
        title: "Troubleshooting",
        description: "Resolve common setup, form, and dialog issues.",
        Content: Troubleshooting,
      },
    ],
  },
];

export const docs = docSections.flatMap((section) => section.pages);

export function DocsNav({ activeSlug }: { activeSlug?: string }) {
  return (
    <nav className="docs-nav" aria-label="Documentation">
      <strong>Documentation</strong>
      {docSections.map((section) => (
        <div className="docs-nav-section" key={section.title}>
          <span>{section.title}</span>
          {section.pages.map((page) => (
            <Link
              key={page.slug}
              href={`/docs/${page.slug}`}
              aria-current={activeSlug === page.slug ? "page" : undefined}
            >
              {page.title}
            </Link>
          ))}
        </div>
      ))}
    </nav>
  );
}
