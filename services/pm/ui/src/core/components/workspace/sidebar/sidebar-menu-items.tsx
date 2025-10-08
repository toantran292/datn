import { SidebarItem } from "@/ce/components/workspace/sidebar/sidebar-item";
import { WORKSPACE_SIDEBAR_STATIC_NAVIGATION_ITEMS_LINKS } from "@uts/constants";
import { observer } from "mobx-react";

export const SidebarMenuItems = observer(() => {
  return (
    <>
      <div className="flex flex-col gap-0.5">
        {WORKSPACE_SIDEBAR_STATIC_NAVIGATION_ITEMS_LINKS.map((item, _index) => (
          <SidebarItem key={`static_${_index}`} item={item} />
        ))}
      </div>
    </>
  );
});
