"use client";

import React, { useState } from "react";
import { FormProvider, useForm, Controller, useFormContext } from "react-hook-form";
import { Info } from "lucide-react";
import { ModalCore } from "../modals/modal-core";
import { EModalPosition, EModalWidth } from "../modals/constants";
import { Button } from "../button";
import { Input } from "../form-fields/input";
import { TextArea } from "../form-fields/textarea";
import { Tooltip } from "../tooltip";
import { setToast, TOAST_TYPE } from "../toast";

interface CreateProjectModalProps {
  isOpen: boolean;
  onClose: () => void;
  workspaceId: string;
  workspaceSlug?: string;
  apiBaseUrl?: string;
  onSuccess?: () => void;
}

interface ProjectFormData {
  name: string;
  identifier: string;
  description?: string;
}

const DEFAULT_PROJECT_FORM_VALUES: ProjectFormData = {
  name: "",
  identifier: "",
  description: "",
};

// Helper function to sanitize project identifier
const projectIdentifierSanitizer = (value: string): string => {
  return value.replace(/[^a-zA-Z0-9çşğıİöüÇŞĞIÖÜ]/g, "").toUpperCase();
};

// ProjectCommonAttributes Component
const ProjectCommonAttributes: React.FC<{
  isChangeInIdentifierRequired: boolean;
  setIsChangeInIdentifierRequired: (value: boolean) => void;
}> = ({ isChangeInIdentifierRequired, setIsChangeInIdentifierRequired }) => {
  const {
    formState: { errors },
    control,
    setValue,
  } = useFormContext<ProjectFormData>();

  const handleNameChange = (onChange: (...event: any[]) => void) => (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!isChangeInIdentifierRequired) {
      onChange(e);
      return;
    }
    if (e.target.value === "") setValue("identifier", "");
    else setValue("identifier", projectIdentifierSanitizer(e.target.value).substring(0, 5));
    onChange(e);
  };

  const handleIdentifierChange = (onChange: (...event: any[]) => void) => (e: React.ChangeEvent<HTMLInputElement>) => {
    const { value } = e.target;
    const alphanumericValue = projectIdentifierSanitizer(value);
    setIsChangeInIdentifierRequired(false);
    onChange(alphanumericValue);
  };

  return (
    <div className="grid grid-cols-1 gap-x-2 gap-y-3 md:grid-cols-4">
      <div className="md:col-span-3">
        <Controller
          control={control}
          name="name"
          rules={{
            required: "Name is required",
            maxLength: {
              value: 255,
              message: "Title should be less than 255 characters",
            },
          }}
          render={({
            field: { value, onChange },
          }: {
            field: { value: string; onChange: (...event: any[]) => void };
          }) => (
            <Input
              id="name"
              name="name"
              type="text"
              value={value}
              onChange={handleNameChange(onChange)}
              hasError={Boolean(errors.name)}
              placeholder="Project name"
              className="w-full focus:border-blue-400"
            />
          )}
        />
        <span className="text-xs text-red-500">{errors?.name?.message as string}</span>
      </div>
      <div className="relative">
        <Controller
          control={control}
          name="identifier"
          rules={{
            required: "Project ID is required",
            validate: (value: string) =>
              /^[ÇŞĞIİÖÜA-Z0-9]+$/.test(value.toUpperCase()) || "Only alphanumeric non-latin characters allowed",
            minLength: {
              value: 1,
              message: "Project ID must be at least 1 character",
            },
            maxLength: {
              value: 5,
              message: "Project ID must be at most 5 characters",
            },
          }}
          render={({
            field: { value, onChange },
          }: {
            field: { value: string; onChange: (...event: any[]) => void };
          }) => (
            <Input
              id="identifier"
              name="identifier"
              type="text"
              value={value}
              onChange={handleIdentifierChange(onChange)}
              hasError={Boolean(errors.identifier)}
              placeholder="Project ID"
              className={`w-full text-xs focus:border-blue-400 pr-7 ${value ? "uppercase" : ""}`}
            />
          )}
        />
        <Tooltip
          tooltipContent="Helps you identify work items in the project uniquely. Max 5 characters."
          className="text-sm"
          position="right"
        >
          <Info className="absolute right-2 top-2.5 h-3 w-3 text-custom-text-400" />
        </Tooltip>
        <span className="text-xs text-red-500">{errors?.identifier?.message as string}</span>
      </div>
      <div className="md:col-span-4">
        <Controller
          name="description"
          control={control}
          render={({
            field: { value, onChange },
          }: {
            field: { value: string | undefined; onChange: (...event: any[]) => void };
          }) => (
            <TextArea
              id="description"
              name="description"
              value={value || ""}
              placeholder="Description"
              onChange={onChange}
              className="!h-24 text-sm focus:border-blue-400"
            />
          )}
        />
      </div>
    </div>
  );
};

// ProjectCreateButtons Component
const ProjectCreateButtons: React.FC<{ handleClose: () => void }> = ({ handleClose }) => {
  const {
    formState: { isSubmitting },
  } = useFormContext<ProjectFormData>();

  return (
    <div className="flex justify-end gap-2 py-4 border-t border-custom-border-100">
      <Button variant="neutral-primary" size="sm" onClick={handleClose}>
        Cancel
      </Button>
      <Button variant="primary" type="submit" size="sm" loading={isSubmitting}>
        {isSubmitting ? "Creating" : "Create Project"}
      </Button>
    </div>
  );
};

// CreateProjectForm Component
const CreateProjectForm: React.FC<{
  workspaceId: string;
  apiBaseUrl?: string;
  onClose: () => void;
  onSuccess?: () => void;
}> = ({ workspaceId, apiBaseUrl, onClose, onSuccess }) => {
  const [isChangeInIdentifierRequired, setIsChangeInIdentifierRequired] = useState(true);

  const methods = useForm<ProjectFormData>({
    defaultValues: DEFAULT_PROJECT_FORM_VALUES,
    reValidateMode: "onChange",
  });

  const { handleSubmit, reset } = methods;

  const apiBase = `${apiBaseUrl}/pm`;

  const onSubmit = async (formData: ProjectFormData) => {
    const payload = {
      name: formData.name,
      identifier: formData.identifier.toUpperCase(),
      orgId: workspaceId,
    };

    try {
      const res = await fetch(`${apiBase}/api/projects`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));

        const nameError =
          errorData.name &&
          (typeof errorData.name === "string"
            ? errorData.name.toLowerCase().includes("already exist")
            : errorData.name?.includes?.("PROJECT_NAME_ALREADY_EXIST"));

        const identifierError =
          errorData.identifier &&
          (typeof errorData.identifier === "string"
            ? errorData.identifier.toLowerCase().includes("already exist")
            : errorData.identifier?.includes?.("PROJECT_IDENTIFIER_ALREADY_EXIST"));

        if (nameError) {
          setToast({
            type: TOAST_TYPE.ERROR,
            title: "Error",
            message: "Project name already exists",
          });
        } else if (identifierError) {
          setToast({
            type: TOAST_TYPE.ERROR,
            title: "Error",
            message: "Project identifier already exists",
          });
        } else {
          const errorMessage = Object.values(errorData)[0] || "Failed to create project";
          setToast({
            type: TOAST_TYPE.ERROR,
            title: "Error",
            message: typeof errorMessage === "string" ? errorMessage : "Failed to create project",
          });
        }
        return;
      }

      setToast({
        type: TOAST_TYPE.SUCCESS,
        title: "Success",
        message: "Project created successfully",
      });

      onSuccess?.();
      onClose();
    } catch (error: any) {
      setToast({
        type: TOAST_TYPE.ERROR,
        title: "Error",
        message: error.message || "Failed to create project",
      });
    }
  };

  const handleClose = () => {
    onClose();
    setIsChangeInIdentifierRequired(true);
    setTimeout(() => {
      reset();
    }, 300);
  };

  return (
    <FormProvider {...methods}>
      <h1 className="px-5 pt-4 text-custom-primary-200">Create Project</h1>
      <form onSubmit={handleSubmit(onSubmit)} className="px-3">
        <div className="mt-6 space-y-6 pb-5">
          <ProjectCommonAttributes
            isChangeInIdentifierRequired={isChangeInIdentifierRequired}
            setIsChangeInIdentifierRequired={setIsChangeInIdentifierRequired}
          />
        </div>
        <ProjectCreateButtons handleClose={handleClose} />
      </form>
    </FormProvider>
  );
};

// Main Modal Component
export const CreateProjectModal: React.FC<CreateProjectModalProps> = ({
  isOpen,
  onClose,
  workspaceId,
  workspaceSlug,
  apiBaseUrl,
  onSuccess,
}) => {
  if (!isOpen) return null;

  return (
    <ModalCore isOpen={isOpen} handleClose={onClose} position={EModalPosition.TOP} width={EModalWidth.XXL}>
      <CreateProjectForm workspaceId={workspaceId} apiBaseUrl={apiBaseUrl} onClose={onClose} onSuccess={onSuccess} />
    </ModalCore>
  );
};
