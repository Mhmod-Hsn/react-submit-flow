import createMDX from "@next/mdx";

const withMDX = createMDX({ options: { remarkPlugins: [], rehypePlugins: [] } });
const [repositoryOwner, repositoryName] = process.env.GITHUB_REPOSITORY?.split("/") ?? [];
const isAccountSite =
  repositoryName?.toLowerCase() === `${repositoryOwner?.toLowerCase()}.github.io`;
const basePath =
  process.env.GITHUB_PAGES === "true" && repositoryName && !isAccountSite
    ? `/${repositoryName}`
    : "";

export default withMDX({
  output: "export",
  trailingSlash: true,
  basePath,
  images: { unoptimized: true },
  pageExtensions: ["js", "jsx", "md", "mdx", "ts", "tsx"],
  transpilePackages: ["react-submit-flow"],
});
