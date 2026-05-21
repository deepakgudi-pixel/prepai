"use client";

import React from "react";
import { PDFDownloadLink } from "@react-pdf/renderer";
import { RecipePDF } from "@/components/extras/RecipePDF";
import { Download } from "lucide-react";

export default function RecipePDFButton({ recipe }) {
  return (
    <PDFDownloadLink
      document={<RecipePDF recipe={recipe} />}
      fileName={`${recipe.title.replace(/\s+/g, "-").toLowerCase()}.pdf`}
    >
      {({ loading }) => (
        <button
          disabled={loading}
          className="glass-pill inline-flex items-center gap-2 border-white/20 bg-white/10 px-5 py-3.5 text-xs uppercase tracking-[0.16em] text-[#EAE8E3] transition-colors hover:bg-white/20 sm:px-6 sm:py-4 sm:tracking-[0.2em]"
        >
          <Download className="size-4" /> {loading ? "Preparing..." : "PDF"}
        </button>
      )}
    </PDFDownloadLink>
  );
}
