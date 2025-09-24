import { CreateProjectForm } from "@/ce/components/projects/create/root";
import { EModalPosition, EModalWidth, ModalCore } from "@unified-teamspace/ui";
import { FC } from "react";

type Props = {
  isOpen: boolean;
  onClose: () => void;
  setToFavorite?: boolean;
  workspaceSlug: string;
  data?: any;
  templateId?: string;
};

export const CreateProjectModal: FC<Props> = (props) => {
  const { isOpen, onClose, setToFavorite = false, workspaceSlug, data, templateId } = props;

  console.log("isOpen", isOpen);

  return (
    <ModalCore isOpen={isOpen} position={EModalPosition.TOP} width={EModalWidth.XXL}>
      ádakdskadkaksdkaksdkakakdskasdkskdkd
      {/* <CreateProjectForm
        setToFavorite={setToFavorite}
        workspaceSlug={workspaceSlug}
        onClose={onClose}
        updateCoverImageStatus={() => Promise.resolve()}
        handleNextStep={() => {}}
        data={data}
        templateId={templateId}
      /> */}
    </ModalCore>
  );
};
