import type { ReactNode } from "react";

declare module "react" {
  type ViewTransitionShare = string;
  type ViewTransitionDefault = "none" | "auto";

  interface ViewTransitionProps {
    name?: string;
    share?: ViewTransitionShare;
    default?: ViewTransitionDefault;
    children?: ReactNode;
  }

  export const ViewTransition: (props: ViewTransitionProps) => ReactNode;
}
