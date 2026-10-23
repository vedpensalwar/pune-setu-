"use client";

import React, { useState, useRef } from "react";
import { ComplaintImage } from "@/components/civic/complaint-image";
import {
  UploadCloud,
  FileText,
  Video,
  Image as ImageIcon,
  Trash2,
  AlertCircle,
  CheckCircle2,
  Loader2,
  Info,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { StoredFile } from "@/lib/storage";

export interface EvidenceItem extends StoredFile {
  caption?: string;
}

interface StepEvidenceProps {
  evidenceList: EvidenceItem[];
  onChange: (items: EvidenceItem[]) => void;
  onNext: () => void;
}

export function StepEvidence({ evidenceList, onChange, onNext }: StepEvidenceProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFiles = async (files: FileList | File[]) => {
    setError(null);
    const fileArray = Array.from(files);

    if (evidenceList.length + fileArray.length > 5) {
      setError("A maximum of 5 evidence files can be attached per grievance.");
      return;
    }

    setUploading(true);
    const newItems: EvidenceItem[] = [];

    for (const file of fileArray) {
      if (file.size > 10 * 1024 * 1024) {
        setError(`"${file.name}" exceeds 10MB limit and was not uploaded.`);
        continue;
      }

      try {
        const formData = new FormData();
        formData.append("file", file);

        const res = await fetch("/api/uploads", {
          method: "POST",
          body: formData,
        });

        const data = await res.json();
        if (!res.ok || !data.success) {
          throw new Error(data.error || `Failed to upload ${file.name}`);
        }

        newItems.push({
          ...data.file,
          caption: "",
        });
      } catch (err: any) {
        setError(err.message || "Failed to upload one or more files.");
      }
    }

    if (newItems.length > 0) {
      onChange([...evidenceList, ...newItems]);
    }
    setUploading(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFiles(e.dataTransfer.files);
    }
  };

  const removeFile = (id: string) => {
    onChange(evidenceList.filter((item) => item.id !== id));
  };

  const updateCaption = (id: string, caption: string) => {
    onChange(
      evidenceList.map((item) => (item.id === id ? { ...item, caption } : item))
    );
  };

  return (
    <div className="space-y-6">
      {/* Step Header */}
      <div>
        <div className="flex items-center gap-2 mb-1">
          <Badge variant="brand" size="sm">
            Step 1 of 5
          </Badge>
          <span className="text-xs text-content-muted">Supporting Documentation</span>
        </div>
        <h2 className="text-xl sm:text-2xl font-bold text-content-primary">
          Attach Supporting Evidence
        </h2>
        <p className="text-xs sm:text-sm text-content-secondary mt-1">
          Photographs, videos, or documents help field officers verify and prioritize the civic issue in your ward.
        </p>
      </div>

      {/* Error alert */}
      {error && (
        <div className="p-3.5 rounded-base bg-status-danger/10 border border-status-danger/20 flex items-start gap-2.5 text-xs text-status-danger">
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      {/* Dropzone */}
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setIsDragging(true);
        }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        className={`border-2 border-dashed rounded-base p-6 sm:p-8 text-center cursor-pointer transition-colors ${
          isDragging
            ? "border-brand bg-brand/5"
            : "border-border bg-surface-subtle hover:bg-surface-hover hover:border-brand/50"
        }`}
      >
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept="image/jpeg,image/png,image/webp,application/pdf,video/mp4,audio/mpeg,audio/wav"
          className="hidden"
          onChange={(e) => {
            if (e.target.files) handleFiles(e.target.files);
          }}
        />

        <div className="flex flex-col items-center justify-center gap-2.5">
          <div className="w-12 h-12 rounded-full bg-brand/10 text-brand flex items-center justify-center">
            {uploading ? (
              <Loader2 className="w-6 h-6 animate-spin" />
            ) : (
              <UploadCloud className="w-6 h-6" />
            )}
          </div>

          <div>
            <p className="text-sm font-bold text-content-primary">
              {uploading ? "Uploading Evidence..." : "Click or drag & drop files here"}
            </p>
            <p className="text-xs text-content-muted mt-1">
              Supports JPEG, PNG, WebP, PDF, MP4 (Max 10MB per file, up to 5 files)
            </p>
          </div>

          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={uploading || evidenceList.length >= 5}
            onClick={(e) => {
              e.stopPropagation();
              fileInputRef.current?.click();
            }}
          >
            Select Files
          </Button>
        </div>
      </div>

      {/* Uploaded Files Gallery */}
      {evidenceList.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold text-content-primary uppercase tracking-wide">
              Attached Files ({evidenceList.length} / 5)
            </h3>
            <span className="text-[11px] text-content-muted">Stored securely on server</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {evidenceList.map((item) => (
              <Card key={item.id} className="p-3 border-border bg-surface flex flex-col gap-2.5">
                <div className="flex items-start gap-3">
                  {/* Thumbnail / Icon */}
                  <div className="w-16 h-16 rounded-subtle bg-surface-subtle border border-border shrink-0 overflow-hidden flex items-center justify-center">
                    {item.mimeType.startsWith("image/") ? (
                      <ComplaintImage
                        src={item.url}
                        alt={item.originalFilename}
                        className="w-full h-full"
                      />
                    ) : item.mimeType === "application/pdf" ? (
                      <FileText className="w-7 h-7 text-status-danger" />
                    ) : item.mimeType.startsWith("video/") ? (
                      <Video className="w-7 h-7 text-accent" />
                    ) : (
                      <ImageIcon className="w-7 h-7 text-brand" />
                    )}
                  </div>

                  {/* Details */}
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-bold text-content-primary truncate">
                      {item.originalFilename}
                    </p>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge variant="neutral" size="sm">
                        {item.evidenceType}
                      </Badge>
                      <span className="text-[11px] text-content-muted">
                        {(item.sizeBytes / 1024).toFixed(0)} KB
                      </span>
                    </div>
                  </div>

                  {/* Delete button */}
                  <button
                    type="button"
                    onClick={() => removeFile(item.id)}
                    className="text-content-muted hover:text-status-danger p-1 rounded-subtle hover:bg-status-danger/10 transition-colors"
                    title="Remove file"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>

                {/* Optional Caption */}
                <input
                  type="text"
                  placeholder="Add note or caption (e.g. Near corner lamp post)..."
                  value={item.caption || ""}
                  onChange={(e) => updateCaption(item.id, e.target.value)}
                  maxLength={150}
                  className="w-full text-xs px-2.5 py-1.5 rounded-subtle border border-border bg-surface text-content-primary placeholder:text-content-muted focus:outline-none focus:ring-1 focus:ring-brand"
                />
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Helpful Hint */}
      <div className="rounded-base bg-surface-subtle border border-border p-3.5 flex items-start gap-2.5 text-xs text-content-secondary">
        <Info className="w-4 h-4 text-brand shrink-0 mt-0.5" />
        <p>
          Evidence attachment is highly recommended but optional if you cannot take a photo at this moment. You can proceed directly to location selection.
        </p>
      </div>

      {/* Action Footer */}
      <div className="flex items-center justify-between pt-4 border-t border-border">
        <span className="text-xs text-content-muted">
          {evidenceList.length} of 5 files attached
        </span>
        <Button
          type="button"
          variant="primary"
          onClick={onNext}
          disabled={uploading}
        >
          Continue to Location Selection
        </Button>
      </div>
    </div>
  );
}
