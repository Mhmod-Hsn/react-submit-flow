import createMDX from '@next/mdx';

const withMDX = createMDX({ options: { remarkPlugins: [], rehypePlugins: [] } });

export default withMDX({
  pageExtensions: ['js', 'jsx', 'md', 'mdx', 'ts', 'tsx'],
  transpilePackages: ['react-submit-flow'],
});
