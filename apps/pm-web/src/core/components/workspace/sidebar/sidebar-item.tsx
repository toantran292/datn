"use client";

import { FC, ReactNode } from "react";
import { observer } from "mobx-react";
import Link from "next/link";
import { usePathname, useParams } from "next/navigation";
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
  const params = useParams<{ projectId?: string }>();

  // Build href with projectId
  const itemHref = params?.projectId ? `/project/${params.projectId}${item.href}` : item.href;

  const isActive = pathname === itemHref || pathname.endsWith(item.href);

  const icon = getSidebarNavigationItemIcon(item.key);

  return (
    <Link href={itemHref} onClick={() => {}}>
      <SidebarNavItem isActive={isActive}>
        <div className="flex items-center gap-2 py-[1px]">
          {icon}
          {/* eslint-disable-next-line */}
          <span className="text-sm leading-5 font-medium">{item.labelTranslationKey}</span>
        </div>
      </SidebarNavItem>
    </Link>
  );
});
