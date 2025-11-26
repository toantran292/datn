import { FC } from "react";
import { EModalPosition, EModalWidth, ModalCore } from "@uts/design-system/ui";
import { CreateProjectForm } from "@/ce/components/projects/create/root";

type Props = {
  isOpen: boolean;
  onClose: () => void;
  setToFavorite?: boolean;
  workspaceSlug: string;
  data?: any;
  templateId?: string;
  onSuccess?: () => void;
};

export const CreateProjectModal: FC<Props> = (props) => {
  const { isOpen, onClose, setToFavorite = false, workspaceSlug, data, templateId, onSuccess } = props;

  return (
    <ModalCore isOpen={isOpen} position={EModalPosition.TOP} width={EModalWidth.XXL}>
      <CreateProjectForm
        setToFavorite={setToFavorite}
        workspaceSlug={workspaceSlug}
        onClose={onClose}
        updateCoverImageStatus={() => Promise.resolve()}
        handleNextStep={() => {}}
        data={data}
        templateId={templateId}
        onSuccess={onSuccess}
      />
    </ModalCore>
  );
};
