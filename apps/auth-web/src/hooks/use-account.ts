import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiGet, apiPut, apiPost, apiPatch } from "@/lib/api";
import { routes } from "@/lib/routes";
import { toast } from "@/lib/toast";
import { authKeys } from "./use-auth";

export interface ProfileData {
  userId: string;
  email: string;
  first_name: string | null;
  last_name: string | null;
  displayName: string | null;
  phone: string | null;
  bio: string | null;
  avatarAssetId: string | null;
  avatarUrl: string | null;
  emailVerified: boolean;
  provider: string;
}

interface UpdateProfileData {
  displayName: string;
  phone?: string;
  bio?: string;
}

interface ChangePasswordData {
  currentPassword: string;
  newPassword: string;
}

interface PresignedUrlResponse {
  assetId: string;
  presignedUrl: string;
  objectKey: string;
  expiresIn: number;
}

export const accountKeys = {
  all: ["account"] as const,
  profile: ["account", "profile"] as const,
};

// Hook for fetching profile data (includes emailVerified and provider)
export function useProfile() {
  return useQuery<ProfileData>({
    queryKey: accountKeys.profile,
    queryFn: () => apiGet<ProfileData>(routes.api.updateProfile()),
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}

// Hook for updating profile
export function useUpdateProfile() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: UpdateProfileData) =>
      apiPut(routes.api.updateProfile(), {
        displayName: data.displayName,
        phone: data.phone,
        bio: data.bio,
      }),
    onSuccess: () => {
      toast.success("Profile updated successfully!");
      // Invalidate auth and profile queries to refresh user data
      queryClient.invalidateQueries({ queryKey: authKeys.me });
      queryClient.invalidateQueries({ queryKey: accountKeys.profile });
    },
    onError: (error: Error) => {
      const errorMessage = error.message || "Failed to update profile";
      toast.error(errorMessage);
    },
  });
}

// Hook for changing password
export function useChangePassword() {
  return useMutation({
    mutationFn: (data: ChangePasswordData) =>
      apiPost(routes.api.changePassword(), {
        current_password: data.currentPassword,
        new_password: data.newPassword,
      }),
    onSuccess: () => {
      toast.success("Password changed successfully!");
    },
    onError: (error: Error) => {
      const errorMessage = error.message || "Failed to change password";
      toast.error(errorMessage);
    },
  });
}

// Hook for uploading avatar
export function useUploadAvatar() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (file: File) => {
      // 1. Get presigned URL
      const presignedResponse = await apiPost<PresignedUrlResponse>(
        routes.api.avatarPresignedUrl(),
        {
          originalName: file.name,
          mimeType: file.type,
          size: file.size,
        }
      );

      // 2. Upload file to presigned URL
      const uploadResponse = await fetch(presignedResponse.presignedUrl, {
        method: "PUT",
        body: file,
        headers: {
          "Content-Type": file.type,
        },
      });

      if (!uploadResponse.ok) {
        throw new Error(`Failed to upload file: ${uploadResponse.status}`);
      }

      // 3. Confirm upload
      await apiPost(routes.api.fileStorageConfirmUpload(), {
        assetId: presignedResponse.assetId,
      });

      // 4. Update avatar in profile
      await apiPatch(routes.api.updateAvatar(), {
        assetId: presignedResponse.assetId,
      });

      return presignedResponse.assetId;
    },
    onSuccess: () => {
      toast.success("Avatar updated successfully!");
      queryClient.invalidateQueries({ queryKey: accountKeys.profile });
    },
    onError: (error: Error) => {
      const errorMessage = error.message || "Failed to upload avatar";
      toast.error(errorMessage);
    },
  });
}
