import { defineMcp } from "@lovable.dev/mcp-js";
import listBlogPostsTool from "./tools/list-blog-posts";
import getBlogPostTool from "./tools/get-blog-post";
import getServiceInfoTool from "./tools/get-service-info";

export default defineMcp({
  name: "gabriel-consultor-mcp",
  title: "Gabriel Consultor MCP",
  version: "0.1.0",
  instructions:
    "Tools for the Gabriel Consultor site. Use `list_blog_posts` and `get_blog_post` to read blog content, and `get_service_info` for details about mentoria, consultoria, and the parceiros program.",
  tools: [listBlogPostsTool, getBlogPostTool, getServiceInfoTool],
});
