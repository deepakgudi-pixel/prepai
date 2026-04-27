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
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
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
    <div className="page-frame space-y-8">
      <section className="grid items-stretch gap-6 lg:grid-cols-[1fr_0.95fr]">
        <div className="section-shell flex h-full flex-col justify-between px-5 py-7 sm:px-8 sm:py-10">
          <div className="space-y-8">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
              <span className="flex size-14 items-center justify-center rounded-full bg-stone-950 text-white shadow-[0_16px_34px_rgba(24,22,18,0.22)] sm:size-16">
                <Package className="size-8" />
              </span>
              <div className="max-w-2xl">
                <p className="eyebrow">Pantry Studio</p>
                <h1 className="section-title mt-4">
                  Your ingredients, styled like a collection.
                </h1>
                <p className="section-copy mt-4">
                  Manage what&apos;s in the kitchen, tune dietary preference, and
                  launch recipe suggestions without leaving the flow.
                </p>
              </div>
            </div>

            <div className="grid gap-px border border-stone-200 bg-stone-200 sm:grid-cols-3">
              <div className="bg-stone-50 p-4">
                <p className="text-[0.68rem] uppercase tracking-[0.2em] text-stone-500">
                  Ingredients
                </p>
                <p className="mt-3 font-display text-3xl leading-none text-stone-950">
                  {items.length}
                </p>
              </div>
              <div className="bg-stone-50 p-4">
                <p className="text-[0.68rem] uppercase tracking-[0.2em] text-stone-500">
                  Dietary mode
                </p>
                <p className="mt-3 font-display text-3xl leading-none capitalize text-stone-950">
                  {dietaryPreference}
                </p>
              </div>
              <div className="bg-stone-50 p-4">
                <p className="text-[0.68rem] uppercase tracking-[0.2em] text-stone-500">
                  Status
                </p>
                <p className="mt-3 font-display text-3xl leading-none text-stone-950">
                  {items.length > 0 ? "Ready" : "Empty"}
                </p>
              </div>
            </div>
          </div>

          {items.length > 0 && (
            <div className="mt-10 flex flex-col gap-3 sm:flex-row">
              <Button
                onClick={handleClearAll}
                variant="outline"
                size="lg"
                disabled={clearing}
                className="border-red-500/20 text-red-700 hover:bg-red-50"
              >
                {clearing ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : (
                  <Trash2 className="size-4" />
                )}
                Clear All
              </Button>
            </div>
          )}
        </div>

        <div className="panel-dark flex h-full flex-col justify-between px-5 py-7 sm:px-8 sm:py-8">
          <div className="space-y-8">
            <div className="max-w-lg">
              <p className="eyebrow border-white/10 bg-white/5 text-stone-200">
                Recipe engine
              </p>
              <h2 className="mt-4 max-w-md font-display text-4xl leading-none text-white sm:text-5xl">
                What can I cook tonight?
              </h2>
              <p className="mt-4 max-w-xl text-base leading-7 text-stone-300">
                Move straight from pantry state to AI recipe suggestions, filtered by
                the way you actually want to eat.
              </p>
            </div>

            <div className="rounded-[22px] border border-white/10 bg-white/7 p-4 sm:p-5">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-sm uppercase tracking-[0.2em] text-stone-300">
                  Dietary preference
                </p>
                <div className="grid w-full grid-cols-3 rounded-full border border-white/10 bg-black/15 p-1 sm:w-auto">
                  {["all", "veg", "non-veg"].map((pref) => (
                    <button
                      key={pref}
                      onClick={() => handlePreferenceChange(pref)}
                      disabled={updatingPref || loadingPref}
                      className={`min-w-0 whitespace-nowrap rounded-full px-2 py-2 text-[0.62rem] uppercase tracking-[0.12em] sm:px-4 sm:text-xs sm:tracking-[0.22em] ${
                        dietaryPreference === pref
                          ? "bg-white text-stone-950"
                          : "text-stone-300"
                      }`}
                    >
                      {pref}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <Link
            href={`/pantry/recipes?diet=${dietaryPreference}`}
            className="mt-8 block rounded-[24px] border border-emerald-400/20 bg-[linear-gradient(135deg,rgba(28,80,66,0.88),rgba(213,144,50,0.7))] p-6 shadow-[0_24px_70px_rgba(0,0,0,0.26)]"
          >
            <div className="flex flex-col items-start gap-4 sm:flex-row sm:items-center">
              <span className="flex size-14 shrink-0 items-center justify-center rounded-full border border-white/15 bg-white/10">
                <ChefHat className="size-7 text-white" />
              </span>
              <div className="flex-1">
                <h3 className="max-w-sm font-display text-3xl leading-none text-white sm:text-4xl">
                  Launch recipe suggestions
                </h3>
                <p className="mt-3 text-sm leading-6 text-white/80">
                  Build ideas from {items.length || "your"} ingredient
                  {items.length === 1 ? "" : "s"} with the current dietary mode.
                </p>
              </div>
              <Badge className="rounded-full bg-white/15 px-4 py-2 text-white">
                {items.length} items
              </Badge>
            </div>
          </Link>
        </div>
      </section>

      {loadingItems && (
        <section className="section-shell flex flex-col items-center justify-center px-6 py-20">
          <Loader2 className="size-10 animate-spin text-emerald-900" />
          <p className="mt-4 text-stone-600">Loading your pantry...</p>
        </section>
      )}

      {isLoaded && !authUser && !loadingItems && (
        <section className="section-shell px-6 py-20 text-center sm:px-8">
          <div className="mx-auto flex size-20 items-center justify-center rounded-full bg-stone-950 text-white">
            <Package className="size-10" />
          </div>
          <h2 className="mt-8 font-display text-5xl leading-none text-stone-950">
            Sign in to use your pantry.
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-base leading-7 text-stone-600">
            Your ingredients, dietary preference, and recipe suggestions are tied to
            your account.
          </p>
        </section>
      )}

      {!loadingItems && items.length > 0 && (
        <section className="section-shell px-5 py-7 sm:px-8 sm:py-8">
          <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="eyebrow">Inventory</p>
              <h2 className="section-title mt-4">Your ingredients.</h2>
            </div>
            <Badge variant="outline" className="rounded-full px-4 py-2">
              {items.length} {items.length === 1 ? "item" : "items"}
            </Badge>
          </div>

          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {items.map((item) => (
              <div key={item.documentId} className="panel-surface p-5">
                {editingId === item.documentId ? (
                  <div className="space-y-3">
                    <input
                      type="text"
                      value={editValues.name}
                      onChange={(e) =>
                        setEditValues({ ...editValues, name: e.target.value })
                      }
                      className="w-full rounded-[18px] border border-stone-900/10 bg-white/80 px-4 py-3 text-sm"
                      placeholder="Ingredient name"
                    />
                    <input
                      type="text"
                      value={editValues.quantity}
                      onChange={(e) =>
                        setEditValues({
                          ...editValues,
                          quantity: e.target.value,
                        })
                      }
                      className="w-full rounded-[18px] border border-stone-900/10 bg-white/80 px-4 py-3 text-sm"
                      placeholder="Quantity"
                    />
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        onClick={saveEdit}
                        disabled={updating}
                        variant="primary"
                        className="flex-1"
                      >
                        {updating ? (
                          <Loader2 className="size-4 animate-spin" />
                        ) : (
                          <Check className="size-4" />
                        )}
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={cancelEdit}
                        disabled={updating}
                        className="flex-1"
                      >
                        <X className="size-4" />
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div>
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-xs uppercase tracking-[0.22em] text-stone-500">
                          Pantry item
                        </p>
                        <h3 className="mt-3 break-words font-display text-3xl leading-none text-stone-950 sm:text-4xl">
                          {item.name}
                        </h3>
                        <p className="mt-3 text-sm text-stone-600">{item.quantity}</p>
                      </div>
                      <div className="flex gap-1">
                        <button
                          onClick={() => startEdit(item)}
                          className="flex size-10 items-center justify-center rounded-full border border-stone-900/10 bg-white/65 text-stone-700 hover:text-emerald-900"
                        >
                          <Edit2 className="size-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(item.documentId)}
                          disabled={deleting}
                          className="flex size-10 items-center justify-center rounded-full border border-stone-900/10 bg-white/65 text-stone-700 hover:text-red-700"
                        >
                          <Trash2 className="size-4" />
                        </button>
                      </div>
                    </div>

                    <p className="mt-8 text-xs uppercase tracking-[0.18em] text-stone-400">
                      Added {formatCreatedAt(item.createdAt)}
                    </p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </section>
      )}

      {!loadingItems && items.length === 0 && (
        <section className="section-shell px-5 py-16 text-center sm:px-8 sm:py-20">
          <div className="mx-auto flex size-20 items-center justify-center rounded-full bg-emerald-950 text-white shadow-[0_18px_36px_rgba(20,97,78,0.2)]">
            <Package className="size-10" />
          </div>
          <h2 className="mt-8 font-display text-5xl leading-none text-stone-950">
            Your pantry is empty.
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-base leading-7 text-stone-600">
            Start with a scan or add a few ingredients manually to bring the recipe
            engine to life.
          </p>
          <Button
            onClick={() => setIsModalOpen(true)}
            variant="primary"
            size="lg"
            className="mt-8"
          >
            <Plus className="size-5" />
            Add Your First Item
          </Button>
        </section>
      )}

      <AddToPantryModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={handleModalSuccess}
        authUser={authUser}
      />
    </div>
  );
}
