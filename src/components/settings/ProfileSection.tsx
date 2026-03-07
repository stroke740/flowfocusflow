import { useState, useRef } from "react";
import { useProfile, useUpdateProfile, useUploadAvatar, useDeleteAvatar } from "@/hooks/use-profile";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Camera, Trash2, Loader2 } from "lucide-react";

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
    <div className="space-y-6">
      {/* Avatar */}
      <div className="flex items-center gap-5">
        <div className="relative group">
          {profile?.avatar_url ? (
            <img src={profile.avatar_url} alt="Avatar" className="w-20 h-20 rounded-full object-cover border-2 border-border" />
          ) : (
            <div className="w-20 h-20 rounded-full bg-primary/10 border-2 border-border flex items-center justify-center text-xl font-bold text-primary">
              {initials}
            </div>
          )}
          <button
            onClick={() => fileInputRef.current?.click()}
            className="absolute inset-0 rounded-full bg-foreground/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity"
          >
            {uploadAvatar.isPending ? <Loader2 size={20} className="text-white animate-spin" /> : <Camera size={20} className="text-white" />}
          </button>
          <input ref={fileInputRef} type="file" accept="image/jpeg,image/png,image/gif,image/webp" className="hidden" onChange={handleAvatarUpload} />
        </div>
        <div className="space-y-1">
          <p className="text-sm font-medium">Profile photo</p>
          <p className="text-xs text-muted-foreground">JPG, PNG, GIF or WEBP. Max 5MB.</p>
          <div className="flex gap-2">
            <Button size="sm" variant="outline" onClick={() => fileInputRef.current?.click()} disabled={uploadAvatar.isPending}>
              Upload
            </Button>
            {profile?.avatar_url && (
              <Button size="sm" variant="ghost" onClick={handleDeleteAvatar} disabled={deleteAvatar.isPending}>
                <Trash2 size={14} className="mr-1" /> Remove
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Display Name */}
      <div className="space-y-2">
        <Label htmlFor="displayName">Display Name</Label>
        <div className="flex gap-2">
          <Input
            id="displayName"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value.slice(0, 60))}
            placeholder="Your name"
            className="max-w-xs"
          />
          <Button onClick={handleSaveName} disabled={updateProfile.isPending || displayName === (profile?.display_name || "")}>
            Save
          </Button>
        </div>
        <p className="text-xs text-muted-foreground">{displayName.length}/60 characters</p>
      </div>
    </div>
  );
};

export default ProfileSection;
