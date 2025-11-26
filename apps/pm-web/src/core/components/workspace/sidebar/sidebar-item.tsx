"use client";

import { FC, ReactNode } from "react";
import { observer } from "mobx-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { IWorkspaceSidebarNavigationItem } from "@uts/constants";
import { getSidebarNavigationItemIcon } from "@/ce/components/workspace/sidebar/helper";
import { SidebarNavItem } from "./sidebar-navigation";

type Props = {
  item: IWorkspaceSidebarNavigationItem;
  additionalRender?: (itemKey: string, workspaceSlug: string) => ReactNode;
  additionalStaticItems?: string[];
};

export const SidebarItemBase: FC<Props> = observer(({ item, additionalRender, additionalStaticItems }) => {
  const pathname = usePathname();
  const slug = "dattuan";
  const itemHref = `/${slug}${item.href}`;

  const isActive = pathname === itemHref;

  const icon = getSidebarNavigationItemIcon(item.key);

  return (
    <Link href={itemHref} onClick={() => {}}>
      <SidebarNavItem isActive={isActive}>
        <div className="flex items-center gap-1.5 py-[1px]">
          {icon}
          <p className="text-sm leading-5 font-medium">test cuc</p>
        </div>
      </SidebarNavItem>
    </Link>
  );
});
