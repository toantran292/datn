// plane types
import { TSearchEntities } from "@uts/types";

export type TMentionSuggestion = {
  entity_identifier: string;
  entity_name: TSearchEntities;
  icon: React.ReactNode;
  id: string;
  subTitle?: string;
  title: string;
  isOnline?: boolean;
};

export type TMentionSection = {
  key: string;
  title?: string;
  items: TMentionSuggestion[];
};

export type TMentionComponentProps = Pick<TMentionSuggestion, "entity_identifier" | "entity_name">;

export type TMentionHandler = {
  getMentionedEntityDetails?: (entity_identifier: string) => { display_name: string } | undefined;
  renderComponent: (props: TMentionComponentProps) => React.ReactNode;
  searchCallback?: (query: string) => Promise<TMentionSection[]>;
};
