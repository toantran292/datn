"use client";

import { useState, useEffect, useCallback, Suspense, useRef } from "react";
import { useRouter } from "next/navigation";
import { Button, Input } from "@uts/design-system/ui";
import { routes } from "@/lib/routes";
import { slugify, validateSlug } from "@/lib/slug";
import { useCreateOrg } from "@/hooks/use-tenants";
import { ProtectedRoute } from "@/components/auth/route-guard";
import { apiGet, apiPost, apiPatch } from "@/lib/api";
import type { CreateOrgRequest } from "@/types/identity";
import { ImageCropper } from "@/components/ImageCropper";

function CreateWorkspacePageContent() {
  const router = useRouter();
  const [displayName, setDisplayName] = useState("");
  const [slug, setSlug] = useState("");
  const [isSlugEdited, setIsSlugEdited] = useState(false);
  const [errors, setErrors] = useState<{ displayName?: string; slug?: string }>({});
  const [slugStatus, setSlugStatus] = useState<'idle' | 'checking' | 'available' | 'taken' | 'invalid'>('idle');
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [showCropper, setShowCropper] = useState(false);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const createOrgMutation = useCreateOrg();

  // Debounced slug availability check
  const checkSlugAvailability = useCallback(async (slugToCheck: string) => {
    if (!slugToCheck || !validateSlug(slugToCheck)) {
      setSlugStatus('invalid');
      return;
    }

    setSlugStatus('checking');

    try {
      const response = await apiGet<{ available: boolean }>(routes.api.orgAvailability(slugToCheck));
      setSlugStatus(response.available ? 'available' : 'taken');

      if (!response.available) {
        setErrors(prev => ({ ...prev, slug: 'This slug is already taken' }));
      } else {
        setErrors(prev => ({ ...prev, slug: undefined }));
      }
    } catch (error) {
      console.error('Slug availability check failed:', error);
      setSlugStatus('idle');
    }
  }, []);

  // Debounce slug check
  useEffect(() => {
    if (!slug) {
      setSlugStatus('idle');
      return;
    }

    const timeoutId = setTimeout(() => {
      checkSlugAvailability(slug);
    }, 500); // 500ms debounce

    return () => clearTimeout(timeoutId);
  }, [slug, checkSlugAvailability]);

  // Auto-generate slug from display name
  useEffect(() => {
    if (!isSlugEdited) {
      if (displayName) {
        const newSlug = slugify(displayName);
        setSlug(newSlug);
      } else {
        // Clear slug when display name is empty
        setSlug('');
      }
    }
  }, [displayName, isSlugEdited]);

  const handleDisplayNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setDisplayName(value);

    // Reset slug editing flag when display name is cleared
    if (!value.trim() && isSlugEdited) {
      setIsSlugEdited(false);
    }

    if (errors.displayName) {
      setErrors(prev => ({ ...prev, displayName: undefined }));
    }
  };

  const handleSlugChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = slugify(e.target.value);
    setSlug(value);
    setIsSlugEdited(true);
    setSlugStatus('idle'); // Reset status when user manually edits
    if (errors.slug) {
      setErrors(prev => ({ ...prev, slug: undefined }));
    }
  };

  const validateForm = () => {
    const newErrors: { displayName?: string; slug?: string } = {};

    if (!displayName.trim()) {
      newErrors.displayName = "Workspace name is required";
    }

    if (!slug.trim()) {
      newErrors.slug = "Workspace slug is required";
    } else if (!validateSlug(slug)) {
      newErrors.slug = "Invalid slug format";
    } else if (slugStatus === 'taken') {
      newErrors.slug = "This slug is already taken";
    } else if (slugStatus === 'checking') {
      newErrors.slug = "Checking slug availability...";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0 && slugStatus === 'available';
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        alert('Please select an image file');
        return;
      }
      // Validate file size (2MB)
      if (file.size > 2 * 1024 * 1024) {
        alert('File size must be less than 2MB');
        return;
      }
      setLogoFile(file);
      setShowCropper(true);
    }
  };

  const handleCropComplete = (croppedFile: File) => {
    // Only save to state, don't auto-submit
    setLogoFile(croppedFile);
    setShowCropper(false);
    // Create preview
    const reader = new FileReader();
    reader.onload = (e) => {
      setLogoPreview(e.target?.result as string);
    };
    reader.readAsDataURL(croppedFile);
  };

  const handleCropCancel = () => {
    setShowCropper(false);
    setLogoFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleRemoveLogo = () => {
    setLogoFile(null);
    setLogoPreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const uploadLogo = async (orgId: string, file: File): Promise<void> => {
    console.log('[Upload Logo] Starting logo upload for org:', orgId);

    // 1. Get presigned URL
    console.log('[Upload Logo] Step 1: Getting presigned URL...');
    const presignedResponse = await apiPost<{
      assetId: string;
      presignedUrl: string;
      objectKey: string;
      expiresIn: number;
    }>(routes.api.orgLogoPresignedUrl(orgId), {
      originalName: file.name,
      mimeType: file.type,
      size: file.size,
    });
    console.log('[Upload Logo] Presigned URL received, assetId:', presignedResponse.assetId);

    // 2. Upload file to presigned URL
    console.log('[Upload Logo] Step 2: Uploading file to MinIO...');
    const uploadResponse = await fetch(presignedResponse.presignedUrl, {
      method: 'PUT',
      body: file,
      headers: {
        'Content-Type': file.type,
      },
    });

    if (!uploadResponse.ok) {
      console.error('[Upload Logo] File upload failed:', uploadResponse.status, uploadResponse.statusText);
      throw new Error(`Failed to upload file: ${uploadResponse.status} ${uploadResponse.statusText}`);
    }
    console.log('[Upload Logo] File uploaded successfully to MinIO');

    // 3. Confirm upload and verify success
    console.log('[Upload Logo] Step 3: Confirming upload with file-storage service...');
    const confirmResponse = await apiPost<{
      statusCode: number;
      data: {
        id: string;
        uploadStatus: string;
        url?: string;
      };
      message?: string;
    }>(routes.api.fileStorageConfirmUpload(), {
      assetId: presignedResponse.assetId,
    });
    console.log('[Upload Logo] Confirm response:', confirmResponse);

    // Verify upload was confirmed successfully
    if (!confirmResponse.data || confirmResponse.data.uploadStatus !== 'completed') {
      console.error('[Upload Logo] Upload confirmation failed:', confirmResponse);
      throw new Error(`Upload confirmation failed: ${confirmResponse.data?.uploadStatus || 'unknown status'}`);
    }
    console.log('[Upload Logo] Upload confirmed successfully, status:', confirmResponse.data.uploadStatus);

    // 4. Update org with logo assetId
    console.log('[Upload Logo] Step 4: Updating org with logo assetId...');
    await apiPatch(routes.api.orgLogo(orgId), {
      assetId: presignedResponse.assetId,
    });
    console.log('[Upload Logo] Org updated with logo assetId:', presignedResponse.assetId);
    console.log('[Upload Logo] Logo upload completed successfully');
  };

  const submitForm = async () => {
    if (!validateForm()) {
      return;
    }

    setIsUploading(true);

    try {
      // 1. Create org first
      console.log('[Create Workspace] Step 1: Creating organization...');
      const createData: CreateOrgRequest = {
        name: displayName.trim(),
        slug: slug.trim(),
      };

      const response = await apiPost<{ id: string }>(routes.api.createOrg(), createData);
      const orgId = response.id;
      console.log('[Create Workspace] Organization created, orgId:', orgId);

      // 2. Upload logo if provided - MUST complete before redirect
      if (logoFile) {
        console.log('[Create Workspace] Step 2: Uploading logo...');
        try {
          await uploadLogo(orgId, logoFile);
          console.log('[Create Workspace] Logo upload completed successfully');
        } catch (error) {
          console.error('[Create Workspace] Failed to upload logo:', error);
          // Continue even if logo upload fails, but log the error
          alert('Workspace created successfully, but logo upload failed. You can update the logo later.');
        }
      } else {
        console.log('[Create Workspace] No logo to upload');
      }

      // 3. Wait a bit to ensure all API calls are completed
      console.log('[Create Workspace] All operations completed, redirecting...');
      await new Promise(resolve => setTimeout(resolve, 100)); // Small delay to ensure all promises resolved

      // 4. Redirect to enter page (this will trigger switch-org API)
      router.push(routes.enter(orgId));
    } catch (error: any) {
      setIsUploading(false);
      const errorMessage = error.message || "Failed to create workspace";
      console.error('[Create Workspace] Error:', error);

      // Check if it's a slug conflict error
      if (errorMessage.includes("slug") || errorMessage.includes("already exists") ||
          errorMessage.includes("slug_exists") || errorMessage.includes("slug_invalid")) {
        setErrors({ slug: "This slug is already taken or invalid" });
      } else {
        alert(errorMessage);
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await submitForm();
  };

  const handleCancel = () => {
    router.push(routes.workspaces());
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="min-h-screen flex">
        {/* Form Section */}
        <div className="w-full lg:w-1/2 flex items-center justify-center p-6 lg:p-12">
          <div className="w-full max-w-md">
            <div className="mb-8">
              <h1 className="text-3xl font-bold text-gray-900 mb-2">Create a new workspace</h1>
              <p className="text-gray-600">Set up a workspace for your team or company.</p>
            </div>

            {/* Success Banner */}
            {createOrgMutation.isPending && (
              <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
                <div className="flex items-center">
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-green-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  <span className="text-green-700 font-medium">Creating workspace...</span>
                </div>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Workspace Name */}
              <div>
                <label htmlFor="display_name" className="block text-sm font-medium text-gray-900 mb-2">
                  Workspace Name <span className="text-red-500">*</span>
                </label>
                <Input
                  id="display_name"
                  type="text"
                  value={displayName}
                  onChange={handleDisplayNameChange}
                  onKeyDown={(e) => {
                    // Prevent form submission on Enter key
                    if (e.key === 'Enter') {
                      e.preventDefault();
                    }
                  }}
                  placeholder="Enter workspace name"
                  className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#00C4AB] focus:ring-opacity-40 focus:border-[#00C4AB] transition-colors ${
                    errors.displayName ? 'border-red-500 bg-red-50' : 'border-gray-300'
                  }`}
                  disabled={createOrgMutation.isPending}
                />
                {errors.displayName && (
                  <div className="mt-2 text-sm text-red-600">
                    <svg className="inline w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                    {errors.displayName}
                  </div>
                )}
              </div>

              {/* Workspace Slug */}
              <div>
                <label htmlFor="slug" className="block text-sm font-medium text-gray-900 mb-2">
                  Workspace Slug
                </label>
                <Input
                  id="slug"
                  type="text"
                  value={slug}
                  onChange={handleSlugChange}
                  onKeyDown={(e) => {
                    // Prevent form submission on Enter key
                    if (e.key === 'Enter') {
                      e.preventDefault();
                    }
                  }}
                  placeholder="workspace-slug"
                  className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#00C4AB] focus:ring-opacity-40 focus:border-[#00C4AB] transition-colors ${
                    errors.slug || slugStatus === 'taken' || slugStatus === 'invalid'
                      ? 'border-red-500 bg-red-50'
                      : slugStatus === 'available'
                        ? 'border-green-500 bg-green-50'
                        : slugStatus === 'checking'
                          ? 'border-blue-500 bg-blue-50'
                          : 'border-gray-300'
                  } ${!isSlugEdited ? 'bg-gray-50' : ''}`}
                  disabled={createOrgMutation.isPending}
                />
                {!errors.slug && !isSlugEdited && displayName && (
                  <p className="mt-2 text-sm text-gray-500">Auto-generated from workspace name</p>
                )}

                {/* Slug Status Indicators */}
                {slugStatus === 'checking' && (
                  <div className="mt-2 text-sm text-blue-600">
                    <svg className="inline w-4 h-4 mr-1 animate-spin" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    Checking availability...
                  </div>
                )}

                {slugStatus === 'available' && !errors.slug && (
                  <div className="mt-2 text-sm text-green-600">
                    <svg className="inline w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                    Slug is available
                  </div>
                )}

                {slugStatus === 'taken' && (
                  <div className="mt-2 text-sm text-red-600">
                    <svg className="inline w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                    </svg>
                    This slug is already taken
                  </div>
                )}

                {slugStatus === 'invalid' && slug && (
                  <div className="mt-2 text-sm text-red-600">
                    <svg className="inline w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                    Invalid slug format
                  </div>
                )}

                {/* Only show form validation errors if not handled by slug status */}
                {errors.slug && slugStatus !== 'taken' && slugStatus !== 'invalid' && (
                  <div className="mt-2 text-sm text-red-600">
                    <svg className="inline w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                    {errors.slug}
                  </div>
                )}
              </div>

              {/* Logo Upload */}
              <div>
                <label className="block text-sm font-medium text-gray-900 mb-2">
                  Workspace Logo (Optional)
                </label>
                {logoPreview ? (
                  <div className="relative">
                    <div className="w-32 h-32 rounded-lg overflow-hidden border-2 border-gray-300">
                      <img
                        src={logoPreview}
                        alt="Logo preview"
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <button
                      type="button"
                      onClick={handleRemoveLogo}
                      className="mt-2 text-sm text-red-600 hover:text-red-700"
                      disabled={isUploading || createOrgMutation.isPending}
                    >
                      Remove logo
                    </button>
                  </div>
                ) : (
                  <div>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleFileSelect}
                      className="hidden"
                      disabled={isUploading || createOrgMutation.isPending}
                    />
                    <div
                      onClick={() => fileInputRef.current?.click()}
                      className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-gray-400 transition-colors cursor-pointer"
                    >
                      <svg className="mx-auto h-12 w-12 text-gray-400 mb-3" stroke="currentColor" fill="none" viewBox="0 0 48 48">
                        <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                      <p className="text-gray-600 font-medium mb-1">Click to upload or drag and drop</p>
                      <p className="text-sm text-gray-500">PNG, JPG up to 2MB (1:1 ratio)</p>
                    </div>
                  </div>
                )}
              </div>

              {/* Image Cropper Modal */}
              {showCropper && logoFile && (
                <ImageCropper
                  image={logoFile}
                  onCropComplete={handleCropComplete}
                  onCancel={handleCropCancel}
                  aspect={1}
                />
              )}

              {/* Form Actions */}
              <div className="flex space-x-4 pt-4">
                <Button
                  type="submit"
                  disabled={isUploading || createOrgMutation.isPending || !displayName.trim() || !slug.trim() || slugStatus !== 'available'}
                  className="flex-1 bg-[#FF8800] text-white py-3 px-6 rounded-lg font-medium hover:bg-orange-600 transition-colors focus:outline-none focus:ring-2 focus:ring-[#FF8800] focus:ring-opacity-40 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {(isUploading || createOrgMutation.isPending) ? (
                    <div className="flex items-center justify-center">
                      <svg className="animate-spin -ml-1 mr-3 h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                      </svg>
                      {isUploading ? "Uploading logo..." : "Creating..."}
                    </div>
                  ) : (
                    "Create workspace"
                  )}
                </Button>
                <Button
                  type="button"
                  onClick={handleCancel}
                  disabled={isUploading || createOrgMutation.isPending}
                  variant="outline-primary"
                  className="px-6 py-3 border-2 border-[#00C4AB] text-[#00C4AB] rounded-lg font-medium hover:bg-[#00C4AB] hover:text-white transition-colors focus:outline-none focus:ring-2 focus:ring-[#00C4AB] focus:ring-opacity-40 disabled:opacity-50"
                >
                  Cancel
                </Button>
              </div>
            </form>
          </div>
        </div>

        {/* Illustration Section */}
        <div className="hidden lg:block lg:w-1/2 relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-orange-50 via-transparent to-teal-50" />
          <div className="relative h-full flex items-center justify-center p-12">
            <div className="text-center">
              <div className="mb-8">
                <div className="w-32 h-32 mx-auto bg-white rounded-2xl shadow-xl flex items-center justify-center mb-6 transform rotate-3">
                  <svg className="w-16 h-16 text-[#FF8800]" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v3h8v-3z" />
                  </svg>
                </div>
                <div className="w-24 h-24 mx-auto bg-white rounded-xl shadow-lg flex items-center justify-center mb-4 transform -rotate-6 translate-x-8">
                  <svg className="w-8 h-8 text-[#00C4AB]" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M3 3a1 1 0 000 2v8a2 2 0 002 2h2.586l-1.293 1.293a1 1 0 101.414 1.414L10 15.414l2.293 2.293a1 1 0 001.414-1.414L12.414 15H15a2 2 0 002-2V5a1 1 0 100-2H3zm11.707 4.707a1 1 0 00-1.414-1.414L10 9.586 8.707 8.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="w-20 h-20 mx-auto bg-white rounded-lg shadow-md flex items-center justify-center transform rotate-12 -translate-x-6">
                  <svg className="w-6 h-6 text-[#FF8800]" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M12.395 2.553a1 1 0 00-1.45-.385c-.345.23-.614.558-.822.88-.214.33-.403.713-.57 1.116-.334.804-.614 1.768-.84 2.734a31.365 31.365 0 00-.613 3.58 2.64 2.64 0 01-.945-1.067c-.328-.68-.398-1.534-.398-2.654A1 1 0 005.05 6.05 6.981 6.981 0 003 11a7 7 0 1011.95-4.95c-.592-.591-.98-.985-1.348-1.467-.363-.476-.724-1.063-1.207-2.03zM12.12 15.12A3 3 0 017 13s.879.5 2.5.5c0-1 .5-4 1.25-4.5.5 1 .786 1.293 1.371 1.879A2.99 2.99 0 0113 13a2.99 2.99 0 01-.879 2.121z" clipRule="evenodd" />
                  </svg>
                </div>
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-4">Build something amazing</h3>
              <p className="text-gray-600 max-w-sm mx-auto">
                Create a collaborative workspace where your team can work together, share ideas, and achieve great results.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Loading fallback component
function LoadingFallback() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-center">
        <div className="w-16 h-16 bg-gradient-to-br from-[#FF8800] to-[#00C4AB] rounded-2xl flex items-center justify-center shadow-xl mx-auto mb-4 animate-pulse">
          <svg className="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 24 24">
            <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none" />
          </svg>
        </div>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Loading...</h1>
      </div>
    </div>
  );
}

export default function CreateWorkspacePage() {
  return (
    <ProtectedRoute>
      <Suspense fallback={<LoadingFallback />}>
        <CreateWorkspacePageContent />
      </Suspense>
    </ProtectedRoute>
  );
}
