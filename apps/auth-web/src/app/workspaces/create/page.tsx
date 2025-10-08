"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button, Input } from "@uts/design-system/ui";
import { apiPost } from "@/lib/api";
import { routes } from "@/lib/routes";
import { slugify, validateSlug } from "@/lib/slug";
import { toast } from "@/lib/toast";
import type { CreateTenantRequest, CreateTenantResponse } from "@/types/identity";

export default function CreateWorkspacePage() {
  const router = useRouter();
  const [displayName, setDisplayName] = useState("");
  const [slug, setSlug] = useState("");
  const [isSlugEdited, setIsSlugEdited] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<{ displayName?: string; slug?: string }>({});

  // Auto-generate slug from display name
  useEffect(() => {
    if (!isSlugEdited && displayName) {
      setSlug(slugify(displayName));
    }
  }, [displayName, isSlugEdited]);

  const handleDisplayNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setDisplayName(value);

    if (errors.displayName) {
      setErrors(prev => ({ ...prev, displayName: undefined }));
    }
  };

  const handleSlugChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = slugify(e.target.value);
    setSlug(value);
    setIsSlugEdited(true);
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
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setLoading(true);

    try {
      const createData: CreateTenantRequest = {
        display_name: displayName.trim(),
        slug: slug.trim(),
      };

      const response = await apiPost<CreateTenantResponse>(routes.api.createTenant(), createData);

      toast.success("Workspace created successfully!");

      // Redirect to enter page with the new org ID
      router.push(routes.enter(response.id));
    } catch (error) {
      console.error("Failed to create workspace:", error);
      const errorMessage = error instanceof Error ? error.message : "Failed to create workspace";

      // Check if it's a slug conflict error
      if (errorMessage.includes("slug") || errorMessage.includes("already exists")) {
        setErrors({ slug: "This slug is already taken" });
      } else {
        toast.error(errorMessage);
      }
    } finally {
      setLoading(false);
    }
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
            {loading && (
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
                  placeholder="Enter workspace name"
                  className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#00C4AB] focus:ring-opacity-40 focus:border-[#00C4AB] transition-colors ${
                    errors.displayName ? 'border-red-500 bg-red-50' : 'border-gray-300'
                  }`}
                  disabled={loading}
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
                  placeholder="workspace-slug"
                  className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#00C4AB] focus:ring-opacity-40 focus:border-[#00C4AB] transition-colors ${
                    errors.slug ? 'border-red-500 bg-red-50' : 'border-gray-300'
                  } ${!isSlugEdited ? 'bg-gray-50' : ''}`}
                  disabled={loading}
                />
                {!errors.slug && !isSlugEdited && displayName && (
                  <p className="mt-2 text-sm text-gray-500">Auto-generated from workspace name</p>
                )}
                {!errors.slug && slug && validateSlug(slug) && (
                  <div className="mt-2 text-sm text-green-600">
                    <svg className="inline w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                    Slug is available
                  </div>
                )}
                {errors.slug && (
                  <div className="mt-2 text-sm text-red-600">
                    <svg className="inline w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                    {errors.slug}
                  </div>
                )}
              </div>

              {/* Logo Upload (Placeholder) */}
              <div>
                <label className="block text-sm font-medium text-gray-900 mb-2">
                  Workspace Logo (Optional)
                </label>
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-gray-400 transition-colors">
                  <svg className="mx-auto h-12 w-12 text-gray-400 mb-3" stroke="currentColor" fill="none" viewBox="0 0 48 48">
                    <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                  <p className="text-gray-600 font-medium mb-1">Click to upload or drag and drop</p>
                  <p className="text-sm text-gray-500">PNG, JPG up to 2MB (Coming soon)</p>
                </div>
              </div>

              {/* Form Actions */}
              <div className="flex space-x-4 pt-4">
                <Button
                  type="submit"
                  disabled={loading || !displayName.trim() || !slug.trim()}
                  className="flex-1 bg-[#FF8800] text-white py-3 px-6 rounded-lg font-medium hover:bg-orange-600 transition-colors focus:outline-none focus:ring-2 focus:ring-[#FF8800] focus:ring-opacity-40 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? (
                    <div className="flex items-center justify-center">
                      <svg className="animate-spin -ml-1 mr-3 h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                      </svg>
                      Creating...
                    </div>
                  ) : (
                    "Create workspace"
                  )}
                </Button>
                <Button
                  type="button"
                  onClick={handleCancel}
                  disabled={loading}
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
