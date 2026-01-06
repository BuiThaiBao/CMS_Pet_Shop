import { useCallback } from "react";
import { useDropzone } from "react-dropzone";
import { useTranslation } from "react-i18next";

interface ImageUploadDropzoneProps {
  onImagesDrop: (files: File[]) => Promise<void>;
  isLoading?: boolean;
}

export default function ImageUploadDropzone({
  onImagesDrop,
  isLoading = false,
}: ImageUploadDropzoneProps) {
  const { t } = useTranslation();

  const onDrop = useCallback(
    async (acceptedFiles: File[]) => {
      if (acceptedFiles.length > 0) {
        await onImagesDrop(acceptedFiles);
      }
    },
    [onImagesDrop]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      "image/*": [".jpeg", ".jpg", ".png", ".gif", ".webp"],
    },
    disabled: isLoading,
  });

  return (
    <div
      {...getRootProps()}
      className={`border-2 border-dashed rounded-lg p-8 text-center transition cursor-pointer ${
        isDragActive
          ? "border-indigo-600 bg-indigo-50"
          : "border-gray-300 hover:border-gray-400"
      } ${isLoading ? "opacity-60 cursor-not-allowed" : ""}`}
    >
      <input {...getInputProps()} />
      <div className="flex flex-col items-center">
        <svg
          className="w-12 h-12 text-gray-400 mb-3"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 4v16m8-8H4"
          />
        </svg>
        {isLoading ? (
          <div>
            <p className="text-sm font-medium text-gray-600">{t('common.uploading')}</p>
            <div className="mt-2 w-6 h-6 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto" />
          </div>
        ) : isDragActive ? (
          <p className="text-sm font-medium text-indigo-600">
            {t('common.dropImagesHere')}
          </p>
        ) : (
          <div>
            <p className="text-sm font-medium text-gray-600">
              {t('common.dragDropOrClick')}
            </p>
            <p className="text-xs text-gray-500 mt-1">
              {t('common.supportedFormats')}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
