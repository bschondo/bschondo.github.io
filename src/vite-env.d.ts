declare module "*.mdx" {
  import { ReactNode } from "react";
  const content: (props: any) => ReactNode;
  export default content;
}
