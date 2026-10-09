import type { MDXComponents } from 'mdx/types';

export function useMDXComponents(components: MDXComponents): MDXComponents {
  return {
    h1: (props) => <h1 className="docs-title" {...props} />,
    h2: (props) => <h2 className="docs-heading" {...props} />,
    a: (props) => <a {...props} />,
    ...components,
  };
}
