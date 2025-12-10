import { ListTodo, KanbanSquare, BarChart3, Calendar } from "lucide-react";
import { cn } from "@uts/fe-utils";

export const getSidebarNavigationItemIcon = (key: string, className: string = "") => {
  switch (key) {
    case "backlog":
      return <ListTodo className={cn("size-4 flex-shrink-0", className)} />;
    case "board":
      return <KanbanSquare className={cn("size-4 flex-shrink-0", className)} />;
    case "calendar":
      return <Calendar className={cn("size-4 flex-shrink-0", className)} />;
    case "summary":
      return <BarChart3 className={cn("size-4 flex-shrink-0", className)} />;
    default:
      return null;
  }
};
