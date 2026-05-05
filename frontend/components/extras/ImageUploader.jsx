"use client";

import { useState, useCallback, useRef } from "react";
import { useDropzone } from "react-dropzone";
import { Camera, Upload, X, ImageIcon } from "lucide-react";
import Image from "next/image";
import { motion } from "framer-motion";

export default function ImageUploader({ onImageSelect, loading }) {
  const [preview, setPreview] = useState(null);
  const fileInputRef = useRef(null);

  const onDrop = useCallback(
    (acceptedFiles) => {
      const file = acceptedFiles[0];
      if (!file) return;

      const reader = new FileReader();
      reader.onloadend = () => {
        setPreview(reader.result);
      };
      reader.readAsDataURL(file);
      onImageSelect(file);
    },
    [onImageSelect]
  );

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
    setPreview(null);
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
            {/* Scanning Line Animation */}
            <motion.div
              animate={{ top: ["0%", "100%", "0%"] }}
              transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
              className="absolute left-0 right-0 h-[2px] bg-white shadow-[0_0_20px_4px_rgba(255,255,255,0.8)] z-20"
            />
            {/* Pulse Overlay */}
            <motion.div
              animate={{ opacity: [0.1, 0.3, 0.1] }}
              transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
              className="absolute inset-0 bg-[#EAE8E3] z-10 mix-blend-overlay"
            />
            {/* Scanning Text */}
            <div className="absolute inset-0 z-30 flex items-center justify-center">
              <div className="glass-pill bg-[#111]/80 text-[#EAE8E3] px-8 py-4 border-white/20 text-xs font-semibold uppercase tracking-[0.2em] backdrop-blur-md">
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
        className={`relative w-full min-h-[400px] sm:min-h-[450px] flex items-center justify-center border-[1px] border-dashed rounded-[24px] transition-all duration-500 cursor-pointer overflow-hidden ${
          isDragActive
            ? "border-[#111] bg-[#111]/5 scale-[1.02]"
            : "border-[#D5D3CE] bg-white/30 hover:border-[#aaa] hover:bg-white/50"
        }`}
      >
        <input {...getInputProps()} />

        <div className="absolute inset-0 flex flex-col items-center justify-center gap-8 p-10 text-center">
          {/* Icon */}
          <div
            className={`flex size-20 shrink-0 items-center justify-center rounded-full transition-all duration-500 ${
              isDragActive ? "bg-[#111] scale-110" : "bg-white border border-[#D5D3CE]"
            }`}
          >
            {isDragActive ? (
              <ImageIcon className="w-8 h-8 text-white" />
            ) : (
              <Camera className="w-8 h-8 text-[#111]" />
            )}
          </div>

          {/* Text */}
          <div>
            <h3 className="font-display text-3xl sm:text-4xl text-[#111] mb-2 transition-colors">
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
            <div className="flex flex-col sm:flex-row gap-4 mt-2 relative z-10 pointer-events-auto">
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  fileInputRef.current?.click();
                }}
                className="glass-pill bg-[#222] text-[#EAE8E3] px-6 py-4 text-xs font-semibold uppercase tracking-[0.2em] hover:bg-[#111] transition-colors flex items-center justify-center gap-3"
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
                className="glass-pill border border-[#D5D3CE] bg-white px-6 py-4 text-xs font-semibold uppercase tracking-[0.2em] text-[#222] hover:bg-white/50 transition-colors flex items-center justify-center gap-3"
              >
                <Upload className="size-4" />
                Browse Files
              </button>
            </div>
          )}

          {/* Helper Text */}
          <p className="text-[0.65rem] uppercase tracking-[0.2em] text-[#aaa] absolute bottom-6">
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