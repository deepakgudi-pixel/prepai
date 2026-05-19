"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { useDropzone } from "react-dropzone";
import { Camera, Upload, X, ImageIcon } from "lucide-react";
import Image from "next/image";
import { motion, useReducedMotion } from "framer-motion";

export default function ImageUploader({ onImageSelect, loading }) {
  const [preview, setPreview] = useState(null);
  const fileInputRef = useRef(null);
  const previewUrlRef = useRef(null);
  const prefersReducedMotion = useReducedMotion();

  const setPreviewFromFile = useCallback((file) => {
    if (previewUrlRef.current) {
      URL.revokeObjectURL(previewUrlRef.current);
      previewUrlRef.current = null;
    }

    if (!file) {
      setPreview(null);
      return;
    }

    const nextPreviewUrl = URL.createObjectURL(file);
    previewUrlRef.current = nextPreviewUrl;
    setPreview(nextPreviewUrl);
  }, []);

  const onDrop = useCallback(
    (acceptedFiles) => {
      const file = acceptedFiles[0];
      if (!file) return;

      setPreviewFromFile(file);
      onImageSelect(file);
    },
    [onImageSelect, setPreviewFromFile]
  );

  useEffect(() => {
    return () => {
      if (previewUrlRef.current) {
        URL.revokeObjectURL(previewUrlRef.current);
      }
    };
  }, []);

  const { getRootProps, getInputProps, isDragActive, open } = useDropzone({
    onDrop,
    accept: {
      "image/*": [".jpeg", ".jpg", ".png", ".webp"],
    },
    maxFiles: 1,
    maxSize: 10485760, // 10MB
    noClick: true,
    noKeyboard: true,
  });

  const handleFileInputChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      onDrop([file]);
    }
  };

  const clearImage = () => {
    setPreviewFromFile(null);
    onImageSelect(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  if (preview) {
    return (
      <div className="relative w-full aspect-[4/5] sm:aspect-video bg-[#111] rounded-[24px] overflow-hidden border border-[#D5D3CE]">
        <Image
          src={preview}
          alt="Pantry preview"
          fill
          className={`object-cover transition-opacity duration-1000 ${loading ? "opacity-40 grayscale" : "opacity-100"}`}
        />
        
        {loading && (
          <>
            {!prefersReducedMotion && (
              <>
                <motion.div
                  animate={{ top: ["0%", "100%", "0%"] }}
                  transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
                  className="absolute left-0 right-0 h-[2px] bg-white shadow-[0_0_20px_4px_rgba(255,255,255,0.8)] z-20"
                />
                <motion.div
                  animate={{ opacity: [0.1, 0.3, 0.1] }}
                  transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                  className="absolute inset-0 bg-[#EAE8E3] z-10 mix-blend-overlay"
                />
              </>
            )}
            {/* Scanning Text */}
            <div className="absolute inset-0 z-30 flex items-center justify-center">
              <div className="glass-pill border-white/20 bg-[#111]/80 px-5 py-3 text-center text-[0.65rem] font-semibold uppercase tracking-[0.16em] text-[#EAE8E3] backdrop-blur-md sm:px-8 sm:py-4 sm:text-xs sm:tracking-[0.2em]">
                Analyzing Ingredients...
              </div>
            </div>
          </>
        )}

        {!loading && (
          <button
            onClick={clearImage}
            className="absolute top-4 right-4 bg-black/50 hover:bg-black/80 text-white p-3 rounded-full backdrop-blur-md transition-all z-40 border border-white/20"
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </div>
    );
  }

  return (
    <>
      <div
        {...getRootProps()}
        className={`relative flex min-h-[300px] w-full cursor-pointer items-center justify-center overflow-hidden rounded-[24px] border-[1px] border-dashed transition-all duration-500 sm:min-h-[450px] ${
          isDragActive
            ? "border-[#111] bg-[#111]/5 scale-[1.02]"
            : "border-[#D5D3CE] bg-white/30 hover:border-[#aaa] hover:bg-white/50"
        }`}
      >
        <input {...getInputProps()} />

        <div className="absolute inset-0 flex flex-col items-center justify-center gap-5 p-6 text-center sm:gap-8 sm:p-10">
          {/* Icon */}
          <div
              className={`flex size-16 shrink-0 items-center justify-center rounded-full transition-all duration-500 sm:size-20 ${
              isDragActive ? "bg-[#111] scale-110" : "bg-white border border-[#D5D3CE]"
            }`}
          >
            {isDragActive ? (
              <ImageIcon className="size-7 text-white sm:size-8" />
            ) : (
              <Camera className="size-7 text-[#111] sm:size-8" />
            )}
          </div>

          {/* Text */}
          <div>
            <h3 className="mb-2 font-display text-2xl text-[#111] transition-colors sm:text-4xl">
              {isDragActive ? "Drop image here" : "Scan Your Pantry"}
            </h3>
            <p className="text-[#555] font-light text-sm max-w-sm">
              {isDragActive
                ? "Release to upload"
                : "Take a photo or drag & drop an image of your fridge or pantry."}
            </p>
          </div>

          {/* Buttons */}
          {!isDragActive && (
            <div className="relative z-10 mt-2 flex w-full flex-col gap-3 px-2 pointer-events-auto sm:w-auto sm:flex-row sm:gap-4 sm:px-0">
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  fileInputRef.current?.click();
                }}
                className="glass-pill flex items-center justify-center gap-3 bg-[#222] px-5 py-3.5 text-xs font-semibold uppercase tracking-[0.16em] text-[#EAE8E3] transition-colors hover:bg-[#111] sm:px-6 sm:py-4 sm:tracking-[0.2em]"
              >
                <Camera className="size-4" />
                Take Photo
              </button>

              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  open();
                }}
                className="glass-pill flex items-center justify-center gap-3 border border-[#D5D3CE] bg-white px-5 py-3.5 text-xs font-semibold uppercase tracking-[0.16em] text-[#222] transition-colors hover:bg-white/50 sm:px-6 sm:py-4 sm:tracking-[0.2em]"
              >
                <Upload className="size-4" />
                Browse Files
              </button>
            </div>
          )}

          {/* Helper Text */}
          <p className="absolute bottom-4 px-4 text-[0.6rem] uppercase tracking-[0.16em] text-[#aaa] sm:bottom-6 sm:text-[0.65rem] sm:tracking-[0.2em]">
            JPG, PNG, WebP • Max 10MB
          </p>
        </div>
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        onChange={handleFileInputChange}
        className="hidden"
      />
    </>
  );
}
