"use client";

import { useRef, useState } from "react";
import { Camera, Loader2 } from "lucide-react";
import { toast } from "react-toastify";
import { userService } from "@/lib/userService";
import { authService } from "@/lib/authService";

interface ProfileImageUploadProps {
  userId: string;
  currentImageUrl: string | null;
  fullName: string;
  onUploadSuccess: (newUrl: string) => void;
}

export default function ProfileImageUpload({
  userId,
  currentImageUrl,
  fullName,
  onUploadSuccess,
}: ProfileImageUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [preview, setPreview] = useState<string | null>(currentImageUrl);
  const [imgError, setImgError] = useState(false);

  const initial = fullName?.charAt(0).toUpperCase() || "U";
  const showImage = !!preview && !imgError;

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    const allowed = ["image/jpeg", "image/png", "image/gif", "image/webp"];
    if (!allowed.includes(file.type)) {
      toast.error("Only JPEG, PNG, GIF, and WebP images are allowed.");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error("Image must be smaller than 5 MB.");
      return;
    }

    const localPreview = URL.createObjectURL(file);
    setPreview(localPreview);
    setImgError(false);
    setUploading(true);

    try {
      const updated = await userService.uploadProfileImage(userId, file);
      const newUrl = updated.profileImageUrl ?? "";
      authService.updateSessionImage(newUrl);
      setPreview(newUrl);
      setImgError(false);
      onUploadSuccess(newUrl);
      window.dispatchEvent(new CustomEvent("profileImageUpdated", { detail: newUrl }));
      toast.success("Profile photo updated.");
    } catch (err: unknown) {
      setPreview(currentImageUrl);
      setImgError(false);
      const msg =
        (err as { response?: { data?: { message?: string } } })?.response?.data
          ?.message || "Upload failed. Please try again.";
      toast.error(msg);
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  return (
    <div className="flex flex-col items-center gap-3">
      <div className="relative group">
        <div
          className="h-24 w-24 rounded-full overflow-hidden flex items-center justify-center cursor-pointer"
          style={{ backgroundColor: "var(--color-neutral-200)" }}
          onClick={() => !uploading && inputRef.current?.click()}
        >
          {showImage ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={preview!}
              alt=""
              className="h-full w-full object-cover"
              onError={() => setImgError(true)}
            />
          ) : (
            <span
              className="text-3xl font-bold select-none"
              style={{ color: "var(--color-neutral-600)" }}
            >
              {initial}
            </span>
          )}

          <div
            className="absolute inset-0 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
            style={{ backgroundColor: "rgba(0,0,0,0.45)" }}
          >
            {uploading ? (
              <Loader2 className="h-6 w-6 text-white animate-spin" />
            ) : (
              <Camera className="h-6 w-6 text-white" />
            )}
          </div>
        </div>
      </div>

      <button
        type="button"
        onClick={() => !uploading && inputRef.current?.click()}
        disabled={uploading}
        className="text-xs font-medium"
        style={{ color: "#5B4FE5" }}
      >
        {uploading ? "Uploading…" : "Change photo"}
      </button>

      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/gif,image/webp"
        className="hidden"
        onChange={handleFileChange}
      />
    </div>
  );
}
