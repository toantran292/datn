import { FC } from "react";
import { IWorkspaceSidebarNavigationItem } from "@uts/constants";
import { SidebarItemBase } from "@/core/components/workspace/sidebar/sidebar-item";

type Props = {
  item: IWorkspaceSidebarNavigationItem;
};

export const SidebarItem: FC<Props> = ({ item }) => <SidebarItemBase item={item} />;
