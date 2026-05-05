/* eslint-disable react-hooks/set-state-in-effect */
"use client";

import {
  clearAllPantryItems,
  deletePantryItem,
  getPantryItems,
  updatePantryItem,
} from "@/actions/pantry.actions";
import {
  getUserPreference,
  updateUserPreference,
} from "@/actions/recipe.actions";
import AddToPantryModal from "@/components/extras/AddToPantryModal";
import useFetch from "@/hooks/use-fetch";
import { useUser } from "@clerk/nextjs";
import {
  Check,
  ChefHat,
  Edit2,
  Loader2,
  Package,
  Plus,
  Trash2,
  X,
} from "lucide-react";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";

export default function PantryPage() {
  const { user, isLoaded } = useUser();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [items, setItems] = useState([]);
  const [editingId, setEditingId] = useState(null);
  const [editValues, setEditValues] = useState({ name: "", quantity: "" });
  const [dietaryPreference, setDietaryPreference] = useState("all");

  const { loading: loadingPref, data: prefData, fn: fetchPref } =
    useFetch(getUserPreference);
  const {
    loading: updatingPref,
    fn: updatePrefAction,
  } = useFetch(updateUserPreference);
  const { loading: loadingItems, data: itemsData, fn: fetchItems } =
    useFetch(getPantryItems);
  const { loading: deleting, data: deleteData, fn: deleteItem } =
    useFetch(deletePantryItem);
  const { loading: updating, data: updateData, fn: updateItem } =
    useFetch(updatePantryItem);
  const { loading: clearing, data: clearData, fn: clearAll } =
    useFetch(clearAllPantryItems);

  const authUser = useMemo(() => {
    if (!user) {
      return null;
    }

    return {
      id: user.id,
      email: user.primaryEmailAddress?.emailAddress || "",
      username:
        user.username || user.primaryEmailAddress?.emailAddress?.split("@")[0] || "",
      firstName: user.firstName || "",
      lastName: user.lastName || "",
      imageUrl: user.imageUrl || "",
    };
  }, [user]);

  useEffect(() => {
    if (!isLoaded) {
      return;
    }

    fetchItems(authUser);
    fetchPref(authUser);
  }, [isLoaded, authUser]);

  useEffect(() => {
    if (prefData?.success) {
      setDietaryPreference(prefData.preference);
    }
  }, [prefData]);

  useEffect(() => {
    if (itemsData?.success) {
      setItems(itemsData.items);
    } else if (itemsData && !itemsData.success && !loadingItems) {
      toast.error(itemsData.message || "Failed to load pantry items");
    }
  }, [itemsData]);

  useEffect(() => {
    if (deleteData?.success && !deleting) {
      toast.success("Item removed from pantry");
      fetchItems(authUser);
    }
  }, [deleteData, deleting, authUser]);

  useEffect(() => {
    if (clearData?.success && !clearing) {
      toast.success(clearData.message);
      fetchItems(authUser);
    }
  }, [clearData, clearing, authUser]);

  useEffect(() => {
    if (updateData?.success) {
      toast.success("Item updated successfully");
      setEditingId(null);
      fetchItems(authUser);
    }
  }, [updateData, authUser]);

  const handleDelete = async (itemId) => {
    const formData = new FormData();
    formData.append("itemId", itemId);
    formData.append("authUser", JSON.stringify(authUser));
    await deleteItem(formData);
  };

  const handleClearAll = async () => {
    if (
      window.confirm(
        "Are you sure you want to clear ALL ingredients? This cannot be undone.",
      )
    ) {
      const formData = new FormData();
      formData.append("authUser", JSON.stringify(authUser));
      await clearAll(formData);
    }
  };

  const startEdit = (item) => {
    setEditingId(item.documentId);
    setEditValues({ name: item.name, quantity: item.quantity });
  };

  const saveEdit = async () => {
    const formData = new FormData();
    formData.append("itemId", editingId);
    formData.append("name", editValues.name);
    formData.append("quantity", editValues.quantity);
    formData.append("authUser", JSON.stringify(authUser));
    await updateItem(formData);
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditValues({ name: "", quantity: "" });
  };

  const handlePreferenceChange = async (pref) => {
    if (pref === dietaryPreference || updatingPref) return;

    const previousPreference = dietaryPreference;
    setDietaryPreference(pref);

    const result = await updatePrefAction(authUser, pref);

    if (result?.success) {
      toast.success("Dietary preference updated successfully");
      return;
    }

    setDietaryPreference(previousPreference);
    toast.error(result?.message || "Failed to save preference");
  };

  const handleModalSuccess = () => {
    fetchItems(authUser);
  };

  const formatCreatedAt = (value) =>
    new Intl.DateTimeFormat("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      timeZone: "UTC",
    }).format(new Date(value));

  return (
    <div className="bg-[#EAE8E3] min-h-screen pb-32">
      <div className="max-w-[1400px] mx-auto px-4 sm:px-12 lg:px-20 pt-32 space-y-8">
        
        {/* Header Grid */}
        <section className="grid items-stretch gap-6 lg:grid-cols-[1fr_0.95fr] min-w-0 overflow-hidden">
          <div className="glass-card flex h-full flex-col justify-between p-6 sm:p-14">
            <div className="space-y-5">
              <div className="flex items-center gap-3 sm:gap-4">
                <span className="flex size-11 sm:size-14 shrink-0 items-center justify-center rounded-full bg-[#222] text-[#EAE8E3]">
                  <Package className="size-5 sm:size-7" />
                </span>
                <p className="eyebrow">Pantry Studio</p>
              </div>
              <div>
                <h1 className="font-display text-3xl sm:text-5xl leading-none text-[#111] mb-4 sm:mb-6">
                  Your ingredients,<br/> styled like a collection.
                </h1>
                <p className="text-[#555] font-light leading-relaxed max-w-md">
                  Manage what&apos;s in the kitchen, tune dietary preference, and
                  launch recipe suggestions without leaving the flow.
                </p>
              </div>

              <div className="flex gap-8 sm:gap-12 pt-2">
                <div>
                  <p className="text-[0.68rem] uppercase tracking-[0.2em] text-[#777]">
                    Ingredients
                  </p>
                  <p className="mt-3 font-display text-4xl leading-none text-[#111]">
                    {items.length}
                  </p>
                </div>
                <div>
                  <p className="text-[0.68rem] uppercase tracking-[0.2em] text-[#777]">
                    Dietary mode
                  </p>
                  <p className="mt-3 font-display text-4xl leading-none capitalize text-[#111]">
                    {dietaryPreference}
                  </p>
                </div>
              </div>
            </div>

            {items.length > 0 && (
              <div className="mt-12 flex gap-4">
                <button
                  onClick={() => setIsModalOpen(true)}
                  className="glass-pill bg-[#222] text-white px-6 py-3 text-xs uppercase tracking-[0.2em] hover:bg-[#111] transition-colors flex items-center gap-2"
                >
                  <Plus className="size-4" /> Add Item
                </button>
                <button
                  onClick={handleClearAll}
                  disabled={clearing}
                  className="glass-pill px-6 py-3 text-xs uppercase tracking-[0.2em] text-[#777] hover:text-red-600 transition-colors flex items-center gap-2"
                >
                  {clearing ? <Loader2 className="size-4 animate-spin" /> : <Trash2 className="size-4" />}
                  Clear All
                </button>
              </div>
            )}
          </div>

          <div className="glass-card bg-[#111] border-white/10 text-white flex h-full flex-col justify-between p-6 sm:p-14">
            <div className="space-y-12">
              <div className="max-w-lg">
                <p className="eyebrow border-white/10 text-[#aaa] mb-4">
                  Recipe engine
                </p>
                <h2 className="font-display text-3xl sm:text-5xl leading-none text-[#EAE8E3] mb-4 sm:mb-6">
                  What can I cook tonight?
                </h2>
                <p className="text-[#aaa] font-light leading-relaxed">
                  Move straight from pantry state to AI recipe suggestions, filtered by
                  the way you actually want to eat.
                </p>
              </div>

              <div className="rounded-2xl sm:rounded-full border border-white/10 bg-black/40 p-2 inline-flex flex-wrap items-center gap-2">
                <span className="text-xs uppercase tracking-[0.2em] text-[#777] pl-4 pr-2">
                  Diet:
                </span>
                <div className="flex gap-1">
                  {["all", "veg", "non-veg"].map((pref) => (
                    <button
                      key={pref}
                      onClick={() => handlePreferenceChange(pref)}
                      disabled={updatingPref || loadingPref}
                      className={`rounded-full px-3 sm:px-4 py-2 text-[0.6rem] sm:text-xs uppercase tracking-[0.15em] sm:tracking-[0.2em] transition-all ${
                        dietaryPreference === pref
                          ? "bg-[#EAE8E3] text-[#111]"
                          : "text-[#777] hover:text-[#EAE8E3]"
                      }`}
                    >
                      {pref}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <Link
              href={`/pantry/recipes?diet=${dietaryPreference}`}
              className="mt-8 sm:mt-12 block rounded-[24px] bg-[#EAE8E3] p-5 sm:p-8 hover:scale-[1.02] hover:bg-white transition-all duration-500 group"
            >
              <div className="flex flex-col items-start gap-6 sm:flex-row sm:items-center justify-between">
                <div className="flex items-center gap-4 sm:gap-6">
                  <span className="flex size-12 sm:size-16 shrink-0 items-center justify-center rounded-full bg-[#111] text-[#EAE8E3] group-hover:bg-[#222] transition-colors">
                    <ChefHat className="size-6 sm:size-8" />
                  </span>
                  <div>
                    <h3 className="font-display text-xl sm:text-3xl text-[#111] mb-1 sm:mb-2">
                      Launch Suggestions
                    </h3>
                    <p className="text-sm font-light text-[#555]">
                      Build ideas from {items.length || "your"} item{items.length === 1 ? "" : "s"}.
                    </p>
                  </div>
                </div>
                <div className="rounded-full border border-[#111]/20 px-6 py-3 text-[#111] text-sm uppercase tracking-[0.1em] font-semibold">
                  {items.length} Ready
                </div>
              </div>
            </Link>
          </div>
        </section>

        {/* Loading State */}
        {loadingItems && (
          <section className="glass-card flex flex-col items-center justify-center px-6 py-32">
            <Loader2 className="size-10 animate-spin text-[#555]" />
          </section>
        )}

        {/* Signed Out State */}
        {isLoaded && !authUser && !loadingItems && (
          <section className="glass-card px-6 py-32 text-center">
            <div className="mx-auto flex size-20 items-center justify-center rounded-full bg-[#111] text-[#EAE8E3] mb-8">
              <Package className="size-10" />
            </div>
            <h2 className="font-display text-6xl text-[#111] mb-6">
              Sign in to use your pantry.
            </h2>
            <p className="mx-auto text-lg text-[#555] font-light max-w-xl">
              Your ingredients, dietary preference, and recipe suggestions are tied to
              your account.
            </p>
          </section>
        )}

        {/* Empty State */}
        {!loadingItems && items.length === 0 && authUser && (
          <section className="glass-card px-6 py-32 text-center">
            <div className="mx-auto flex size-24 items-center justify-center rounded-full border border-[#D5D3CE] bg-white/50 mb-8">
              <Package className="size-10 text-[#222]" />
            </div>
            <h2 className="font-display text-6xl text-[#111] mb-6">
              Your pantry is empty.
            </h2>
            <p className="mx-auto text-lg text-[#555] font-light max-w-xl mb-12">
              Start with a scan or add a few ingredients manually to bring the recipe
              engine to life.
            </p>
            <button
              onClick={() => setIsModalOpen(true)}
              className="glass-pill bg-[#222] text-white px-8 py-4 text-sm uppercase tracking-[0.2em] hover:bg-[#111] transition-colors inline-flex items-center gap-3"
            >
              <Plus className="size-5" /> Add First Item
            </button>
          </section>
        )}

        {/* Inventory Grid */}
        {!loadingItems && items.length > 0 && (
          <section className="pt-12">
            <div className="mb-12 flex justify-between items-end">
              <div>
                <p className="eyebrow mb-4">Inventory</p>
                <h2 className="font-display text-5xl">Your ingredients</h2>
              </div>
            </div>

            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              <AnimatePresence>
                {items.map((item, i) => (
                  <motion.div 
                    key={item.documentId} 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ duration: 0.4, delay: i * 0.05 }}
                    className="glass-card p-8 group hover:border-[#aaa] transition-colors flex flex-col justify-between min-h-[240px]"
                  >
                    {editingId === item.documentId ? (
                      <div className="space-y-4 h-full flex flex-col justify-center">
                        <input
                          type="text"
                          value={editValues.name}
                          onChange={(e) =>
                            setEditValues({ ...editValues, name: e.target.value })
                          }
                          className="w-full bg-transparent border-b border-[#D5D3CE] py-2 text-2xl font-display text-[#111] placeholder:text-[#aaa] focus:border-[#222] transition-colors outline-none"
                          placeholder="Ingredient name"
                        />
                        <input
                          type="text"
                          value={editValues.quantity}
                          onChange={(e) =>
                            setEditValues({ ...editValues, quantity: e.target.value })
                          }
                          className="w-full bg-transparent border-b border-[#D5D3CE] py-2 text-sm text-[#555] placeholder:text-[#aaa] focus:border-[#222] transition-colors outline-none"
                          placeholder="Quantity"
                        />
                        <div className="flex gap-4 pt-4 mt-auto">
                          <button
                            onClick={saveEdit}
                            disabled={updating}
                            className="text-xs uppercase tracking-[0.2em] font-semibold text-[#111] hover:text-green-700 transition-colors"
                          >
                            {updating ? "Saving..." : "Save"}
                          </button>
                          <button
                            onClick={cancelEdit}
                            disabled={updating}
                            className="text-xs uppercase tracking-[0.2em] font-semibold text-[#777] hover:text-[#111] transition-colors"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    ) : (
                      <>
                        <div>
                          <div className="flex justify-between items-start mb-6">
                            <p className="text-[0.65rem] uppercase tracking-[0.2em] text-[#777]">
                              Added {formatCreatedAt(item.createdAt)}
                            </p>
                            <div className="opacity-0 group-hover:opacity-100 transition-opacity flex gap-3">
                              <button
                                onClick={() => startEdit(item)}
                                className="text-[#777] hover:text-[#111] transition-colors"
                              >
                                <Edit2 className="size-4" />
                              </button>
                              <button
                                onClick={() => handleDelete(item.documentId)}
                                disabled={deleting}
                                className="text-[#777] hover:text-red-700 transition-colors"
                              >
                                <Trash2 className="size-4" />
                              </button>
                            </div>
                          </div>
                          <h3 className="font-display text-4xl leading-none text-[#111] mb-4 break-words">
                            {item.name}
                          </h3>
                          <p className="text-sm text-[#555] font-light">{item.quantity}</p>
                        </div>
                        <div className="mt-8 border-t border-[#D5D3CE] pt-6 flex justify-between items-center opacity-0 group-hover:opacity-100 transition-opacity">
                          <span className="text-[0.65rem] uppercase tracking-[0.2em] text-[#aaa]">Item details</span>
                          <span className="size-8 rounded-full bg-[#EAE8E3] border border-[#D5D3CE] flex items-center justify-center">
                            <Package className="size-3 text-[#555]" />
                          </span>
                        </div>
                      </>
                    )}
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          </section>
        )}

        <AddToPantryModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          onSuccess={handleModalSuccess}
          authUser={authUser}
        />
      </div>
    </div>
  );
}
