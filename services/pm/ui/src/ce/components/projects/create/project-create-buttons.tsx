import { useFormContext } from "react-hook-form";
// plane imports
import { ETabIndices } from "@unified-teamspace/constants";
import { IProject } from "@unified-teamspace/types";
// ui
import { Button } from "@unified-teamspace/ui";
// helpers
import { getTabIndex } from "@unified-teamspace/fe-utils";

type Props = {
  handleClose: () => void;
  isMobile?: boolean;
};

const ProjectCreateButtons: React.FC<Props> = (props) => {
  const { handleClose, isMobile = false } = props;
  const {
    formState: { isSubmitting },
  } = useFormContext<IProject>();

  const { getIndex } = getTabIndex(ETabIndices.PROJECT_CREATE, isMobile);

  return (
    <div className="flex justify-end gap-2 py-4 border-t border-custom-border-100">
      <Button variant="neutral-primary" size="sm" onClick={handleClose} tabIndex={getIndex("cancel")}>
        Cancel
      </Button>
      <Button variant="primary" type="submit" size="sm" loading={isSubmitting} tabIndex={getIndex("submit")}>
        {isSubmitting ? "Creating" : "Create Project"}
      </Button>
    </div>
  );
};

export default ProjectCreateButtons;
