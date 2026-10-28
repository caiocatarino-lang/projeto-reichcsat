import { queryOptions } from "@tanstack/react-query";
import { getWorkspace } from "./workspace.functions";
export const workspaceQuery = queryOptions({ queryKey: ["workspace"], queryFn: () => getWorkspace() });
export const pageHead = (title: string, description: string) => ({ meta: [
  { title: `${title} — ReichCsat` }, { name: "description", content: description },
  { property: "og:title", content: `${title} — ReichCsat` }, { property: "og:description", content: description },
  { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary" },
] });