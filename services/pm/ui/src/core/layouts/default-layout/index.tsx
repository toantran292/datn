import { FC, ReactNode } from "react";
import { cn } from "@uts/fe-utils";

type Props = {
  children: ReactNode;
  gradient?: boolean;
  className?: string;
};

const DefaultLayout: FC<Props> = ({ children, gradient = false, className }) => (
  <div className={cn(`h-screen w-full overflow-hidden ${gradient ? "" : "bg-custom-background-100"}`, className)}>
    {children}
  </div>
);

export default DefaultLayout;
