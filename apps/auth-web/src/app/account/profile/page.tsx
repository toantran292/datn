"use client";

import { useState, useEffect, useRef } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Button, Input, Card } from "@uts/design-system/ui";
import { useProfile, useUpdateProfile, useUploadAvatar } from "@/hooks/use-account";
import { routes } from "@/lib/routes";
import { toast } from "@/lib/toast";
import { ImageCropper } from "@/components/ImageCropper";

export default function ProfilePage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { data: profile, isLoading: isLoadingProfile, refetch } = useProfile();
  const updateProfileMutation = useUpdateProfile();
  const uploadAvatarMutation = useUploadAvatar();

  const [displayName, setDisplayName] = useState("");
  const [phone, setPhone] = useState("");
  const [bio, setBio] = useState("");
  const [hasChanges, setHasChanges] = useState(false);

  // Avatar upload state
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [showCropper, setShowCropper] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Handle success/error messages from OAuth redirect
  useEffect(() => {
    const linked = searchParams.get("linked");
    const error = searchParams.get("error");

    if (linked === "google") {
      toast.success("Google account linked successfully!");
      // Refresh profile data to show updated provider
      refetch();
      // Clean up URL
      router.replace(routes.accountProfile());
    } else if (error === "google_link_failed") {
      toast.error("Failed to link Google account. Please try again.");
      router.replace(routes.accountProfile());
    } else if (error === "google_account_already_linked") {
      toast.error("This Google account is already linked to another user.");
      router.replace(routes.accountProfile());
    }
  }, [searchParams, refetch, router]);

  // Initialize form with profile data
  useEffect(() => {
    if (profile) {
      setDisplayName(profile.displayName || "");
      setPhone(profile.phone || "");
      setBio(profile.bio || "");
    }
  }, [profile]);

  // Track changes
  useEffect(() => {
    if (profile) {
      const originalDisplayName = profile.displayName || "";
      const originalPhone = profile.phone || "";
      const originalBio = profile.bio || "";
      const changed =
        displayName !== originalDisplayName ||
        phone !== originalPhone ||
        bio !== originalBio;
      setHasChanges(changed);
    }
  }, [displayName, phone, bio, profile]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!hasChanges) return;

    updateProfileMutation.mutate({
      displayName,
      phone: phone || undefined,
      bio: bio || undefined,
    });
  };

  const handleReset = () => {
    if (profile) {
      setDisplayName(profile.displayName || "");
      setPhone(profile.phone || "");
      setBio(profile.bio || "");
    }
  };

  // Avatar upload handlers
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.type.startsWith("image/")) {
        toast.error("Please select an image file");
        return;
      }
      if (file.size > 2 * 1024 * 1024) {
        toast.error("File size must be less than 2MB");
        return;
      }
      setAvatarFile(file);
      setShowCropper(true);
    }
  };

  const handleCropComplete = (croppedFile: File) => {
    setShowCropper(false);
    setAvatarFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
    uploadAvatarMutation.mutate(croppedFile);
  };

  const handleCropCancel = () => {
    setShowCropper(false);
    setAvatarFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  if (isLoadingProfile) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-[#FF8800] border-t-transparent" />
      </div>
    );
  }

  const isGoogleLinked = profile?.provider?.toUpperCase() === "GOOGLE";

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold text-[#0F172A]">Profile</h1>
        <p className="text-[#64748B] mt-1">Manage your personal information</p>
      </div>

      {/* Profile Card */}
      <Card className="bg-white/90 backdrop-blur-sm p-6 shadow-lg border border-white/20 rounded-2xl">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Avatar Section */}
          <div className="flex items-center space-x-6 pb-6 border-b border-[#E2E8F0]">
            <div className="relative group">
              {profile?.avatarUrl ? (
                <img
                  src={profile.avatarUrl}
                  alt="Avatar"
                  className="w-20 h-20 rounded-full object-cover shadow-lg"
                />
              ) : (
                <div className="w-20 h-20 bg-gradient-to-br from-[#FF8800] to-[#00C4AB] rounded-full flex items-center justify-center text-white text-2xl font-bold shadow-lg">
                  {displayName?.[0]?.toUpperCase() || profile?.email?.[0]?.toUpperCase() || "U"}
                </div>
              )}
              {/* Upload overlay */}
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploadAvatarMutation.isPending}
                className="absolute inset-0 bg-black/50 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200 cursor-pointer"
              >
                {uploadAvatarMutation.isPending ? (
                  <svg className="animate-spin h-6 w-6 text-white" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                ) : (
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                )}
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileSelect}
                className="hidden"
              />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-[#0F172A]">
                {displayName || "No name set"}
              </h3>
              <p className="text-[#64748B]">{profile?.email}</p>
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploadAvatarMutation.isPending}
                className="text-sm text-[#00C4AB] hover:text-[#00B3A0] font-medium mt-1 transition-colors"
              >
                {uploadAvatarMutation.isPending ? "Uploading..." : "Change avatar"}
              </button>
            </div>
          </div>

          {/* Image Cropper Modal */}
          {showCropper && avatarFile && (
            <ImageCropper
              image={avatarFile}
              onCropComplete={handleCropComplete}
              onCancel={handleCropCancel}
              aspect={1}
            />
          )}

          {/* Display Name */}
          <div>
            <label htmlFor="displayName" className="block text-sm font-semibold text-[#374151] mb-2">
              Display Name
            </label>
            <Input
              id="displayName"
              type="text"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder="Enter your display name"
              className="w-full px-4 py-3 border-2 border-[#E5E7EB] rounded-xl focus:ring-4 focus:ring-[#00C4AB]/25 focus:border-[#00C4AB] transition-all duration-200 bg-white/80"
            />
          </div>

          {/* Phone */}
          <div>
            <label htmlFor="phone" className="block text-sm font-semibold text-[#374151] mb-2">
              Phone Number
            </label>
            <Input
              id="phone"
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="Enter your phone number"
              className="w-full px-4 py-3 border-2 border-[#E5E7EB] rounded-xl focus:ring-4 focus:ring-[#00C4AB]/25 focus:border-[#00C4AB] transition-all duration-200 bg-white/80"
            />
          </div>

          {/* Bio */}
          <div>
            <label htmlFor="bio" className="block text-sm font-semibold text-[#374151] mb-2">
              Bio
            </label>
            <textarea
              id="bio"
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              placeholder="Tell us about yourself"
              rows={3}
              className="w-full px-4 py-3 border-2 border-[#E5E7EB] rounded-xl focus:ring-4 focus:ring-[#00C4AB]/25 focus:border-[#00C4AB] transition-all duration-200 bg-white/80 resize-none"
            />
          </div>

          {/* Email (Read-only) */}
          <div>
            <label htmlFor="email" className="block text-sm font-semibold text-[#374151] mb-2">
              Email Address
            </label>
            <Input
              id="email"
              type="email"
              value={profile?.email || ""}
              disabled
              className="w-full px-4 py-3 border-2 border-[#E5E7EB] rounded-xl bg-[#F9FAFB] text-[#64748B] cursor-not-allowed"
            />
            <p className="text-sm text-[#64748B] mt-2">
              Email cannot be changed. Contact support if you need to update it.
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end space-x-4 pt-6 border-t border-[#E2E8F0]">
            {hasChanges && (
              <Button
                type="button"
                onClick={handleReset}
                variant="outline-primary"
                className="px-6 py-3 rounded-xl border-2 border-[#E2E8F0] text-[#64748B] hover:bg-[#F1F5F9] transition-all duration-200"
              >
                Cancel
              </Button>
            )}
            <Button
              type="submit"
              disabled={!hasChanges || updateProfileMutation.isPending}
              className="px-6 py-3 bg-gradient-to-r from-[#FF8800] to-[#FF7700] hover:from-[#FF7700] hover:to-[#E56600] text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {updateProfileMutation.isPending ? (
                <span className="flex items-center">
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  Saving...
                </span>
              ) : (
                "Save Changes"
              )}
            </Button>
          </div>
        </form>
      </Card>

      {/* Account Info Card */}
      <Card className="bg-white/90 backdrop-blur-sm p-6 shadow-lg border border-white/20 rounded-2xl">
        <h3 className="text-lg font-semibold text-[#0F172A] mb-4">Account Information</h3>
        <div className="space-y-4">
          <div className="flex items-center justify-between py-3 border-b border-[#E2E8F0]">
            <span className="text-[#64748B]">Account ID</span>
            <span className="font-mono text-sm text-[#0F172A]">{profile?.userId?.slice(0, 8)}...</span>
          </div>
          <div className="flex items-center justify-between py-3">
            <span className="text-[#64748B]">Email Verified</span>
            <span className={`px-3 py-1 rounded-full text-sm font-medium ${
              profile?.emailVerified
                ? "bg-green-100 text-green-700"
                : "bg-yellow-100 text-yellow-700"
            }`}>
              {profile?.emailVerified ? "Verified" : "Not Verified"}
            </span>
          </div>
        </div>
      </Card>

      {/* Linked Accounts Card */}
      <Card className="bg-white/90 backdrop-blur-sm p-6 shadow-lg border border-white/20 rounded-2xl">
        <h3 className="text-lg font-semibold text-[#0F172A] mb-4">Linked Accounts</h3>
        <p className="text-[#64748B] text-sm mb-6">
          Connect your social accounts for easier sign-in
        </p>
        <div className="space-y-4">
          {/* Google Account */}
          <div className="flex items-center justify-between p-4 bg-[#F9FAFB] rounded-xl border border-[#E2E8F0]">
            <div className="flex items-center space-x-4">
              <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center shadow-sm">
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
              </div>
              <div>
                <p className="font-medium text-[#0F172A]">Google</p>
                <p className="text-sm text-[#64748B]">
                  {isGoogleLinked ? "Connected to your account" : "Not connected"}
                </p>
              </div>
            </div>
            {isGoogleLinked ? (
              <span className="px-3 py-1.5 bg-green-100 text-green-700 text-sm font-medium rounded-lg flex items-center">
                <svg className="w-4 h-4 mr-1.5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
                Connected
              </span>
            ) : (
              <Button
                onClick={() => {
                  // Redirect to Google OAuth with link_account mode
                  window.location.href = routes.api.linkGoogleAccount();
                }}
                className="px-4 py-2 bg-white border-2 border-[#E2E8F0] hover:border-[#D1D5DB] text-[#374151] font-medium rounded-lg transition-all duration-200 flex items-center space-x-2"
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
                <span>Link Google</span>
              </Button>
            )}
          </div>
        </div>
      </Card>
    </div>
  );
}
