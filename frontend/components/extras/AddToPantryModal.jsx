"use client";

import { useEffect, useState, useCallback } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "../ui/dialog";
import { Camera, Check, Loader2, Plus, X } from "lucide-react";
import useFetch from "@/hooks/use-fetch";
import {
  addPantryItemManually,
  saveToPantry,
  scanPantryImage,
} from "@/actions/pantry.actions";
import { toast } from "sonner";
import ImageUploader from "./ImageUploader";
import { useLenis } from "lenis/react";

function AddToPantryModal({ isOpen, onClose, onSuccess, authUser }) {
  const [activeTab, setActiveTab] = useState("scan");
  const [selectedImage, setSelectedImage] = useState(null);
  const [scannedIngredients, setScannedIngredients] = useState([]);
  const [manualItem, setManualItem] = useState({ name: "", quantity: "" });

  const {
    loading: scanning,
    fn: scanImage,
  } = useFetch(scanPantryImage);

  const {
    loading: saving,
    fn: saveScannedItems,
  } = useFetch(saveToPantry);

  const {
    loading: adding,
    fn: addManualItem,
  } = useFetch(addPantryItemManually);

  const lenis = useLenis();

  useEffect(() => {
    if (isOpen) {
      if (lenis) lenis.stop();
    } else {
      if (lenis) lenis.start();
    }
    return () => {
      if (lenis) lenis.start();
    };
  }, [isOpen, lenis]);

  const handleImageSelect = useCallback((file) => {
    setSelectedImage(file);
    setScannedIngredients([]);
  }, []);

  const handleScan = useCallback(async () => {
    if (!selectedImage) return;
    if (!authUser) {
      toast.error("Please sign in to scan and save pantry items");
      return;
    }
    const formData = new FormData();
    formData.append("image", selectedImage);
    formData.append("authUser", JSON.stringify(authUser));
    const result = await scanImage(formData);
    if (result?.success === false) {
      toast.error(result.message || "Failed to scan image");
      return;
    }

    if (result?.success && result?.ingredients) {
      setScannedIngredients(result.ingredients);
      toast.success(`Found ${result.ingredients.length} ingredients!`);
    }
  }, [selectedImage, authUser, scanImage]);

  const handleClose = useCallback(() => {
    setActiveTab("scan");
    setSelectedImage(null);
    setScannedIngredients([]);
    setManualItem({ name: "", quantity: "" });
    onClose();
  }, [onClose]);

  const handleSaveScanned = useCallback(async () => {
    if (scannedIngredients.length === 0) {
      toast.error("No ingredients to save");
      return;
    }
    if (!authUser) {
      toast.error("Please sign in to save pantry items");
      return;
    }

    const formData = new FormData();
    formData.append("ingredients", JSON.stringify(scannedIngredients));
    formData.append("authUser", JSON.stringify(authUser));
    const result = await saveScannedItems(formData);
    if (result?.success === false) {
      toast.error(result.message || "Failed to save items");
      return;
    }

    if (result?.success) {
      toast.success(result.message);
      handleClose();
      onSuccess?.();
    }
  }, [scannedIngredients, authUser, saveScannedItems, handleClose, onSuccess]);

  const handleAddManual = async (e) => {
    e.preventDefault();
    if (!authUser) {
      toast.error("Please sign in to add pantry items");
      return;
    }
    if (!manualItem.name.trim() || !manualItem.quantity.trim()) {
      toast.error("Please fill in all fields");
      return;
    }

    const formData = new FormData();
    formData.append("name", manualItem.name);
    formData.append("quantity", manualItem.quantity);
    formData.append("authUser", JSON.stringify(authUser));
    const result = await addManualItem(formData);
    if (result?.success === false) {
      toast.error(result.message || "Failed to add item");
      return;
    }

    if (result?.success) {
      toast.success("Item added to pantry!");
      setManualItem({ name: "", quantity: "" });
      handleClose();
      onSuccess?.();
    }
  };

  const removeIngredient = useCallback((index) => {
    setScannedIngredients(prev => prev.filter((_, i) => i !== index));
  }, []);

  return (
    <Dialog
      open={isOpen}
      onOpenChange={(open) => {
        if (!open) {
          handleClose();
        }
      }}
    >
      <DialogContent 
        onPointerDownOutside={(e) => e.preventDefault()}
        className="flex max-h-[calc(100dvh-1.5rem)] max-w-[calc(100%-1.5rem)] flex-col overflow-hidden rounded-[20px] border border-[#D5D3CE] bg-[#EAE8E3] p-0 shadow-2xl sm:max-h-[90vh] sm:max-w-2xl sm:rounded-[32px]"
      >
        <div className="flex min-h-0 flex-1 flex-col overflow-hidden p-5 sm:p-12">
          <DialogHeader className="mb-6 sm:mb-10 text-center sm:text-left">
            <DialogTitle className="font-display text-3xl sm:text-5xl leading-none text-[#111]">
              Add to Pantry
            </DialogTitle>
            <DialogDescription className="mt-4 text-sm font-light text-[#555] max-w-sm">
              Scan your pantry with AI for immediate inventory or add individual items manually.
            </DialogDescription>
          </DialogHeader>

          {/* Custom Tabs */}
          <div className="flex gap-3 sm:gap-4 mb-6 sm:mb-8 pb-3 sm:pb-4 border-b border-[#D5D3CE]">
            <button
              onClick={() => setActiveTab("scan")}
              className={`flex items-center gap-1.5 sm:gap-2 pb-2 text-[0.65rem] sm:text-xs font-semibold uppercase tracking-[0.15em] sm:tracking-[0.2em] transition-colors relative ${
                activeTab === "scan" ? "text-[#111]" : "text-[#aaa] hover:text-[#777]"
              }`}
            >
              <Camera className="w-4 h-4" />
              AI Scan
              {activeTab === "scan" && (
                <span className="absolute bottom-[-17px] left-0 right-0 h-[2px] bg-[#111]" />
              )}
            </button>
            <button
              onClick={() => setActiveTab("manual")}
              className={`flex items-center gap-1.5 sm:gap-2 pb-2 text-[0.65rem] sm:text-xs font-semibold uppercase tracking-[0.15em] sm:tracking-[0.2em] transition-colors relative ${
                activeTab === "manual" ? "text-[#111]" : "text-[#aaa] hover:text-[#777]"
              }`}
            >
              <Plus className="w-4 h-4" />
              Add Manually
              {activeTab === "manual" && (
                <span className="absolute bottom-[-17px] left-0 right-0 h-[2px] bg-[#111]" />
              )}
            </button>
          </div>

          {/* Scan Tab Content */}
          {activeTab === "scan" && (
            <div className="flex flex-col flex-1 min-h-0 animate-in fade-in slide-in-from-bottom-4 duration-500">
              {scannedIngredients.length === 0 ? (
                // Step 1: Upload & Scan
                <div className="space-y-8">
                  <ImageUploader
                    onImageSelect={handleImageSelect}
                    loading={scanning}
                  />

                  {selectedImage && !scanning && (
                    <button
                      onClick={handleScan}
                      disabled={scanning}
                      className="w-full glass-pill bg-[#222] text-[#EAE8E3] px-6 sm:px-8 py-4 sm:py-5 text-xs sm:text-sm font-semibold uppercase tracking-[0.15em] sm:tracking-[0.2em] hover:bg-[#111] transition-colors flex items-center justify-center gap-2 sm:gap-3"
                    >
                      <Camera className="w-5 h-5" />
                      Run AI Analysis
                    </button>
                  )}
                </div>
              ) : (
                // Step 2: Review & Save
                <div className="flex flex-col flex-1 min-h-0 space-y-6">
                  <div className="flex shrink-0 flex-col gap-3 border-b border-[#D5D3CE] pb-3 sm:flex-row sm:items-end sm:justify-between sm:gap-4 sm:pb-4">
                    <div>
                      <p className="eyebrow mb-1 sm:mb-2">Detected Inventory</p>
                      <h3 className="font-display text-2xl sm:text-3xl text-[#111]">
                        Review items
                      </h3>
                    </div>
                    <button
                      onClick={() => {
                        setScannedIngredients([]);
                        setSelectedImage(null);
                      }}
                      className="flex items-center gap-2 text-[0.65rem] font-semibold uppercase tracking-[0.16em] text-[#777] transition-colors hover:text-[#111] sm:tracking-[0.2em]"
                    >
                      <Camera className="w-3 h-3" />
                      Rescan
                    </button>
                  </div>

                  {/* Ingredients List */}
                  <div className="flex-1 min-h-0 overflow-y-auto pr-2 space-y-2 [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-[#D5D3CE] [&::-webkit-scrollbar-thumb]:rounded-full hover:[&::-webkit-scrollbar-thumb]:bg-[#aaa]">
                    {scannedIngredients.map((ingredient, index) => (
                      <div
                        key={index}
                        className="group flex items-center justify-between gap-3 border-b border-[#D5D3CE] py-4 sm:gap-4"
                      >
                        <div className="min-w-0 flex-1">
                          <div className="font-display text-lg sm:text-2xl text-[#111]">
                            {ingredient.name}
                          </div>
                          <div className="text-sm font-light text-[#777] mt-1">
                            {ingredient.quantity}
                          </div>
                        </div>
                        {ingredient.confidence && (
                          <div className="glass-pill px-3 sm:px-4 py-1.5 sm:py-2 border border-[#D5D3CE] text-[0.55rem] sm:text-[0.65rem] uppercase tracking-[0.15em] sm:tracking-[0.2em] text-[#555] shrink-0">
                            {Math.round(ingredient.confidence * 100)}% Match
                          </div>
                        )}
                        <button
                          onClick={() => removeIngredient(index)}
                          className="flex size-8 shrink-0 items-center justify-center rounded-full text-[#777] opacity-100 transition-all hover:bg-white/50 hover:text-[#111] sm:text-[#aaa] sm:opacity-0 sm:group-hover:opacity-100"
                          aria-label={`Remove ${ingredient.name}`}
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>

                  {/* Save Button */}
                  <button
                    onClick={handleSaveScanned}
                    disabled={saving || scannedIngredients.length === 0}
                    className="w-full shrink-0 glass-pill bg-[#222] text-[#EAE8E3] px-6 sm:px-8 py-4 sm:py-5 text-xs sm:text-sm font-semibold uppercase tracking-[0.15em] sm:tracking-[0.2em] hover:bg-[#111] transition-colors flex items-center justify-center gap-2 sm:gap-3 disabled:opacity-50"
                  >
                    {saving ? (
                      <>
                        <Loader2 className="w-5 h-5 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      <>
                        <Check className="w-5 h-5" />
                        Save {scannedIngredients.length} Items to Pantry
                      </>
                    )}
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Manual Add Tab Content */}
          {activeTab === "manual" && (
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
              <form onSubmit={handleAddManual} className="space-y-8 sm:space-y-10">
                <div>
                  <label className="mb-2 block text-[0.65rem] uppercase tracking-[0.2em] text-[#777]">
                    Ingredient Name
                  </label>
                  <input
                    type="text"
                    value={manualItem.name}
                    onChange={(e) =>
                      setManualItem({ ...manualItem, name: e.target.value })
                    }
                    placeholder="e.g., San Marzano Tomatoes"
                    className="w-full border-b border-[#D5D3CE] bg-transparent py-3 font-display text-2xl text-[#111] outline-none transition-colors placeholder:text-[#aaa] focus:border-[#222] sm:text-3xl"
                    disabled={adding}
                  />
                </div>

                <div>
                  <label className="mb-2 block text-[0.65rem] uppercase tracking-[0.2em] text-[#777]">
                    Quantity
                  </label>
                  <input
                    type="text"
                    value={manualItem.quantity}
                    onChange={(e) =>
                      setManualItem({ ...manualItem, quantity: e.target.value })
                    }
                    placeholder="e.g., 2 cans"
                    className="w-full bg-transparent border-b border-[#D5D3CE] py-3 text-lg font-light text-[#555] placeholder:text-[#aaa] focus:border-[#222] transition-colors outline-none"
                    disabled={adding}
                  />
                </div>

                <button
                  type="submit"
                  disabled={adding}
                  className="glass-pill mt-4 flex w-full items-center justify-center gap-3 bg-[#222] px-6 py-4 text-xs font-semibold uppercase tracking-[0.16em] text-[#EAE8E3] transition-colors hover:bg-[#111] disabled:opacity-50 sm:px-8 sm:py-5 sm:text-sm sm:tracking-[0.2em]"
                >
                  {adding ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Adding...
                    </>
                  ) : (
                    <>
                      <Plus className="w-5 h-5" />
                      Add to Inventory
                    </>
                  )}
                </button>
              </form>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default AddToPantryModal;
