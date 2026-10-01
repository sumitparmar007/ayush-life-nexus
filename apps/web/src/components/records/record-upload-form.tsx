"use client";

/**
 * RecordUploadForm — creates a new health record.
 *
 * In this phase, file metadata is captured but no actual blob upload occurs.
 * The form uses react-hook-form + zod for validation, matching the existing
 * auth form patterns.
 */

import * as React from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Upload, FileUp, X, Loader2 } from "lucide-react";
import { cn } from "@nexus/utils";
import { Button, Input, Alert, AlertDescription } from "@nexus/ui";
import {
  RecordCategory,
  RECORD_CATEGORY_LABELS,
} from "@/types/health-records.ts";

// ─── Validation schema ───────────────────────────────────────────────────────

const formSchema = z.object({
  title: z.string().min(1, "Title is required").max(200),
  category: z.nativeEnum(RecordCategory, { required_error: "Select a category" }),
  notes: z.string().max(1000).optional(),
  issuedDate: z.string().optional(),
  providerName: z.string().max(200).optional(),
});

type FormValues = z.infer<typeof formSchema>;

// ─── Component ────────────────────────────────────────────────────────────────

export function RecordUploadForm() {
  const router = useRouter();
  const [file, setFile] = React.useState<File | null>(null);
  const [apiError, setApiError] = React.useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      category: RecordCategory.PRESCRIPTION,
    },
  });

  const onDrop = React.useCallback((e: React.DragEvent) => {
    e.preventDefault();
    const dropped = e.dataTransfer.files[0];
    if (dropped) setFile(dropped);
  }, []);

  const onFileChange = React.useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const selected = e.target.files?.[0];
      if (selected) setFile(selected);
    },
    []
  );

  const removeFile = React.useCallback(() => {
    setFile(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  }, []);

  const onSubmit = async (values: FormValues) => {
    if (!file) {
      setApiError("Please select a file to upload.");
      return;
    }

    setIsSubmitting(true);
    setApiError(null);

    try {
      const body = {
        ...values,
        fileName: file.name,
        fileMimeType: file.type || "application/octet-stream",
        fileSizeBytes: file.size,
      };

      const res = await fetch("/api/records", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const json = (await res.json()) as { error?: { message?: string } };
        throw new Error(json.error?.message ?? "Failed to create record");
      }

      // Navigate to records list on success
      router.push("/records");
      router.refresh();
    } catch (err) {
      setApiError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      className="flex flex-col gap-6"
      noValidate
    >
      {apiError && (
        <Alert variant="destructive">
          <AlertDescription>{apiError}</AlertDescription>
        </Alert>
      )}

      {/* File drop zone */}
      <div
        onDragOver={(e) => e.preventDefault()}
        onDrop={onDrop}
        className={cn(
          "relative flex flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed p-8",
          "transition-all duration-200",
          file
            ? "border-primary/40 bg-primary-subtle"
            : "border-border hover:border-primary/30 hover:bg-neutral-50 dark:hover:bg-neutral-900"
        )}
      >
        {file ? (
          <div className="flex items-center gap-3">
            <FileUp className="size-8 text-primary" />
            <div className="flex flex-col">
              <span className="text-sm font-medium text-foreground">
                {file.name}
              </span>
              <span className="text-xs text-muted-foreground">
                {(file.size / 1024).toFixed(1)} KB · {file.type || "Unknown type"}
              </span>
            </div>
            <button
              type="button"
              onClick={removeFile}
              className="ml-2 flex size-7 items-center justify-center rounded-lg text-muted-foreground hover:bg-neutral-200 dark:hover:bg-neutral-700 transition-colors"
              aria-label="Remove file"
            >
              <X className="size-4" />
            </button>
          </div>
        ) : (
          <>
            <Upload className="size-10 text-muted-foreground/40" />
            <div className="text-center">
              <p className="text-sm font-medium text-foreground">
                Drag and drop your file here
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                or click to browse · PDF, JPG, PNG, DICOM
              </p>
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => fileInputRef.current?.click()}
            >
              Browse files
            </Button>
          </>
        )}
        <input
          ref={fileInputRef}
          type="file"
          accept=".pdf,.jpg,.jpeg,.png,.dicom,.dcm"
          onChange={onFileChange}
          className="sr-only"
          aria-label="Upload file"
        />
      </div>

      {/* Form fields */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <Input
            label="Title *"
            placeholder="e.g. Blood Test Report — Apollo Hospitals"
            errorMessage={errors.title?.message}
            {...register("title")}
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <label
            htmlFor="category"
            className="text-sm font-medium text-foreground"
          >
            Category *
          </label>
          <select
            id="category"
            {...register("category")}
            className={cn(
              "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm",
              "ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
              errors.category && "border-destructive focus-visible:ring-destructive"
            )}
          >
            {Object.entries(RECORD_CATEGORY_LABELS).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
          {errors.category && (
            <p className="text-xs text-destructive">{errors.category.message}</p>
          )}
        </div>

        <Input
          label="Provider / Facility"
          placeholder="e.g. Apollo Hospitals, Chennai"
          {...register("providerName")}
        />

        <Input
          label="Date of Issue"
          type="date"
          {...register("issuedDate")}
        />

        <div className="sm:col-span-2 flex flex-col gap-1.5">
          <label
            htmlFor="notes"
            className="text-sm font-medium text-foreground"
          >
            Notes
          </label>
          <textarea
            id="notes"
            rows={3}
            placeholder="Any additional notes about this record..."
            {...register("notes")}
            className={cn(
              "flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm",
              "ring-offset-background placeholder:text-muted-foreground",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
              "resize-none"
            )}
          />
        </div>
      </div>

      {/* Submit */}
      <div className="flex items-center justify-end gap-3 pt-2">
        <Button
          type="button"
          variant="ghost"
          onClick={() => router.back()}
          disabled={isSubmitting}
        >
          Cancel
        </Button>
        <Button
          type="submit"
          disabled={isSubmitting}
          leftIcon={
            isSubmitting ? (
              <Loader2 className="animate-spin" />
            ) : (
              <Upload />
            )
          }
        >
          {isSubmitting ? "Uploading…" : "Upload Record"}
        </Button>
      </div>
    </form>
  );
}
