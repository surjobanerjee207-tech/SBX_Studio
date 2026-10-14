"use client";

import { useState, useRef } from "react";

interface ThumbnailUploaderProps {
  thumbnailUrl: string;
  autoThumbnail?: string;
  onThumbnailChange: (url: string) => void;
}

export function ThumbnailUploader({
  thumbnailUrl,
  autoThumbnail,
  onThumbnailChange,
}: ThumbnailUploaderProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [showUrlInput, setShowUrlInput] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const displayImage = thumbnailUrl.trim() || autoThumbnail || "";
  const isCustomUpload = thumbnailUrl.startsWith("/uploads/");
  const isExternalUrl = thumbnailUrl.startsWith("http") && !isCustomUpload;
  const isAuto = !thumbnailUrl.trim() && Boolean(autoThumbnail);

  const uploadFile = async (file: File) => {
    if (!file.type.startsWith("image/")) {
      setUploadError("Please upload an image file (PNG, JPG, WebP, SVG).");
      return;
    }

    setUploadError(null);
    setIsUploading(true);

    try {
      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Upload failed");
      }

      onThumbnailChange(data.url);
    } catch (err: any) {
      setUploadError(err.message || "Failed to upload image");
    } finally {
      setIsUploading(false);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      await uploadFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      await uploadFile(e.target.files[0]);
    }
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    onThumbnailChange("");
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <label className="block text-xs font-semibold uppercase tracking-wider text-bone">
          4. Thumbnail Cover Image
        </label>
        <button
          type="button"
          onClick={() => setShowUrlInput(!showUrlInput)}
          className="text-[11px] text-mute hover:text-bone underline underline-offset-4"
        >
          {showUrlInput ? "Hide URL Input" : "Paste image URL instead"}
        </button>
      </div>

      {/* Hidden native file input */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        accept="image/png,image/jpeg,image/jpg,image/webp,image/svg+xml"
        className="hidden"
      />

      {/* Drag & Drop Box */}
      <div
        onDragOver={handleDragOver}
        onDragEnter={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        className={`relative border-2 border-dashed rounded-none transition-all cursor-pointer p-4 group overflow-hidden ${
          isDragging
            ? "border-red bg-red/10 scale-[1.01]"
            : displayImage
            ? "border-white/30 bg-ink hover:border-white/50"
            : "border-white/20 bg-ink hover:border-red/60 hover:bg-white/[0.02]"
        }`}
      >
        {isUploading ? (
          <div className="aspect-video w-full flex flex-col items-center justify-center gap-3">
            <div className="w-8 h-8 border-2 border-red border-t-transparent rounded-full animate-spin" />
            <p className="text-xs text-bone font-medium">Uploading image...</p>
          </div>
        ) : displayImage ? (
          /* Thumbnail preview state */
          <div className="relative aspect-video w-full bg-black overflow-hidden flex items-center justify-center">
            <img
              src={displayImage}
              alt="Thumbnail preview"
              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
            />

            {/* Dark overlay with hover instruction */}
            <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-2 text-center p-4">
              <svg
                className="w-8 h-8 text-white fill-none stroke-current"
                viewBox="0 0 24 24"
                strokeWidth="2"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                />
              </svg>
              <p className="text-xs font-medium text-bone">
                Click or Drop new image to replace
              </p>
              <p className="text-[10px] text-mute">PNG, JPG, WebP up to 15MB</p>
            </div>

            {/* Badges and Clear Button */}
            <div className="absolute top-2 left-2 z-10 flex items-center gap-2">
              <span className="text-[10px] bg-black/80 backdrop-blur text-bone px-2 py-0.5 uppercase tracking-wider font-mono border border-white/20">
                {isCustomUpload
                  ? "Uploaded Image"
                  : isAuto
                  ? "Auto from Video"
                  : isExternalUrl
                  ? "Custom URL"
                  : "Preview"}
              </span>
            </div>

            {thumbnailUrl && (
              <button
                type="button"
                onClick={handleClear}
                title="Remove custom image"
                className="absolute top-2 right-2 z-10 bg-black/80 hover:bg-red text-white p-1.5 transition-colors border border-white/20"
              >
                <svg
                  className="w-3.5 h-3.5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            )}
          </div>
        ) : (
          /* Empty dropzone state */
          <div className="aspect-video w-full flex flex-col items-center justify-center p-6 text-center">
            <div className="w-12 h-12 mb-3 rounded-full bg-white/5 grid place-items-center text-mute group-hover:text-red group-hover:bg-red/10 transition-colors">
              <svg
                className="w-6 h-6 stroke-current fill-none"
                viewBox="0 0 24 24"
                strokeWidth="1.75"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                />
              </svg>
            </div>
            <p className="text-sm font-medium text-bone">
              <span className="text-red underline underline-offset-4">
                Click to browse
              </span>{" "}
              or drag & drop thumbnail here
            </p>
            <p className="text-xs text-mute mt-1.5">
              16:9 ratio recommended (1920×1080) · PNG, JPG, or WebP up to 15MB
            </p>
          </div>
        )}
      </div>

      {uploadError && (
        <p className="text-xs text-red mt-1">✕ {uploadError}</p>
      )}

      {/* Manual URL input fallback (shown if toggled or if user pasted an external URL) */}
      {showUrlInput && (
        <div className="pt-2">
          <input
            type="text"
            value={thumbnailUrl}
            onChange={(e) => onThumbnailChange(e.target.value)}
            placeholder="Or paste an image URL (https://...)"
            className="w-full bg-ink border border-white/20 px-4 py-2.5 text-xs text-bone placeholder-mute/50 focus:border-red focus:outline-none"
          />
        </div>
      )}
    </div>
  );
}
