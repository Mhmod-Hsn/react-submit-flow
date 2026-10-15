import type { MDXComponents } from "mdx/types";
import Link from "next/link";

export function useMDXComponents(components: MDXComponents): MDXComponents {
  return {
    h1: (props) => <h1 className="docs-title" {...props} />,
    h2: (props) => <h2 className="docs-heading" {...props} />,
    a: ({ href, ...props }) =>
      href?.startsWith("/") && !href.startsWith("//") ? (
        <Link href={href} {...props} />
      ) : (
        <a href={href} {...props} />
      ),
    ...components,
  };
}
