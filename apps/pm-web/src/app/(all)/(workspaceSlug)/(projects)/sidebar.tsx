import { FC } from "react";
import { observer } from "mobx-react";
import { SidebarProjectsList } from "@/core/components/workspace/sidebar/project-list";
import { SidebarMenuItems } from "@/core/components/workspace/sidebar/sidebar-menu-items";

export const AppSidebar: FC = observer(() => (
  <>
    <div className="flex flex-col gap-3 overflow-x-hidden scrollbar-sm h-full w-full overflow-y-auto vertical-scrollbar px-3 pt-3 pb-0.5">
      <SidebarMenuItems />

      <SidebarProjectsList />
    </div>
  </>
));
