import { useState, useRef } from "react";
import { useProfile, useUpdateProfile, useUploadAvatar, useDeleteAvatar } from "@/hooks/use-profile";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Camera, Trash2, Loader2, Check } from "lucide-react";

const ProfileSection = () => {
  const { data: profile, isLoading } = useProfile();
  const updateProfile = useUpdateProfile();
  const uploadAvatar = useUploadAvatar();
  const deleteAvatar = useDeleteAvatar();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [displayName, setDisplayName] = useState("");
  const [nameInitialized, setNameInitialized] = useState(false);

  if (profile && !nameInitialized) {
    setDisplayName(profile.display_name || "");
    setNameInitialized(true);
  }

  const initials = (displayName || "U").slice(0, 2).toUpperCase();
  const isDirty = displayName !== (profile?.display_name || "");

  const handleSaveName = async () => {
    if (displayName.length > 60) {
      toast.error("Display name must be 60 characters or less");
      return;
    }
    try {
      await updateProfile.mutateAsync({ display_name: displayName });
      toast.success("Display name updated");
    } catch {
      toast.error("Failed to update name");
    }
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      toast.error("File must be under 5MB");
      return;
    }
    if (!["image/jpeg", "image/png", "image/gif", "image/webp"].includes(file.type)) {
      toast.error("Only JPG, PNG, GIF, and WEBP files allowed");
      return;
    }
    try {
      await uploadAvatar.mutateAsync(file);
      toast.success("Avatar updated");
    } catch {
      toast.error("Failed to upload avatar");
    }
  };

  const handleDeleteAvatar = async () => {
    try {
      await deleteAvatar.mutateAsync();
      toast.success("Avatar removed");
    } catch {
      toast.error("Failed to remove avatar");
    }
  };

  if (isLoading) {
    return <div className="animate-pulse space-y-4"><div className="h-20 bg-muted rounded-xl" /><div className="h-10 bg-muted rounded-xl" /></div>;
  }

  return (
    <div className="space-y-8">
      {/* Avatar */}
      <div className="space-y-3">
        <Label className="text-sm font-semibold">Profile Photo</Label>
        <div className="flex items-center gap-5">
          <div className="relative group">
            {profile?.avatar_url ? (
              <img src={profile.avatar_url} alt="Avatar" className="w-20 h-20 rounded-2xl object-cover border-2 border-border" />
            ) : (
              <div className="w-20 h-20 rounded-2xl bg-primary/10 border-2 border-border flex items-center justify-center text-xl font-bold text-primary">
                {initials}
              </div>
            )}
            <button
              onClick={() => fileInputRef.current?.click()}
              className="absolute inset-0 rounded-2xl bg-foreground/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity"
            >
              {uploadAvatar.isPending ? <Loader2 size={20} className="text-white animate-spin" /> : <Camera size={20} className="text-white" />}
            </button>
            <input ref={fileInputRef} type="file" accept="image/jpeg,image/png,image/gif,image/webp" className="hidden" onChange={handleAvatarUpload} />
          </div>
          <div className="space-y-2">
            <p className="text-xs text-muted-foreground">JPG, PNG, GIF or WEBP. Max 5MB.</p>
            <div className="flex gap-2">
              <Button size="sm" variant="outline" className="rounded-lg text-xs" onClick={() => fileInputRef.current?.click()} disabled={uploadAvatar.isPending}>
                Upload New
              </Button>
              {profile?.avatar_url && (
                <Button size="sm" variant="ghost" className="rounded-lg text-xs text-destructive" onClick={handleDeleteAvatar} disabled={deleteAvatar.isPending}>
                  <Trash2 size={12} className="mr-1" /> Remove
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Display Name */}
      <div className="space-y-2">
        <Label className="text-sm font-semibold">Display Name</Label>
        <p className="text-xs text-muted-foreground">This is how you'll appear in the app.</p>
        <div className="flex gap-2">
          <Input
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value.slice(0, 60))}
            placeholder="Your name"
            className="max-w-xs rounded-lg"
          />
          <Button
            onClick={handleSaveName}
            disabled={updateProfile.isPending || !isDirty}
            className="rounded-lg"
            size="sm"
          >
            {updateProfile.isPending ? (
              <Loader2 size={14} className="animate-spin" />
            ) : isDirty ? (
              "Save"
            ) : (
              <><Check size={14} className="mr-1" /> Saved</>
            )}
          </Button>
        </div>
        <p className="text-[11px] text-muted-foreground">{displayName.length}/60 characters</p>
      </div>

      {/* Account info */}
      <div className="space-y-2 pt-2 border-t border-border">
        <Label className="text-sm font-semibold">About</Label>
        <p className="text-xs text-muted-foreground">
          FocusFlow helps you stay organized and productive. All your data is stored securely and synced in real-time.
        </p>
        <div className="text-[11px] text-muted-foreground/60 space-y-0.5">
          <p>Version 1.0.0</p>
          <p>Built with ❤️ using React, Tailwind & Framer Motion</p>
        </div>
      </div>
    </div>
  );
};

export default ProfileSection;
