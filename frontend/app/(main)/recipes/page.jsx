"use client";

import { useEffect, useMemo } from "react";
import { useUser } from "@clerk/nextjs";
import { Bookmark, Loader2, ChefHat, ArrowRight } from "lucide-react";
import Link from "next/link";
import RecipeCard from "@/components/extras/RecipeCard";
import useFetch from "@/hooks/use-fetch";
import { getSavedRecipes } from "@/actions/recipe.actions";
import { motion } from "framer-motion";

export default function SavedRecipesPage() {
  const { user, isLoaded } = useUser();
  const {
    loading,
    data: recipesData,
    fn: fetchSavedRecipes,
  } = useFetch(getSavedRecipes);

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
    if (!isLoaded || !authUser) {
      return;
    }

    fetchSavedRecipes(authUser);
  }, [isLoaded, authUser]);

  const recipes = recipesData?.recipes || [];

  return (
    <div className="bg-[#EAE8E3] min-h-screen pb-32">
      <div className="max-w-[1400px] mx-auto px-6 sm:px-12 lg:px-20 pt-32 space-y-12">
        
        {/* Header */}
        <section className="flex flex-col md:flex-row items-start md:items-end justify-between gap-8 mb-16">
          <div className="max-w-xl">
            <p className="eyebrow mb-6 flex items-center gap-2">
              <Bookmark className="size-4" /> Saved Archive
            </p>
            <h1 className="font-display text-5xl md:text-7xl leading-none text-[#111]">
              Your personal<br/><span className="italic text-[#777]">cookbook.</span>
            </h1>
          </div>
          <p className="text-lg text-[#555] font-light max-w-sm">
            Keep the recipes worth returning to in a cleaner, calmer archive.
          </p>
        </section>

        {loading && (
          <section className="flex flex-col items-center justify-center py-32">
            <Loader2 className="size-10 animate-spin text-[#777]" />
            <p className="mt-6 text-[0.65rem] uppercase tracking-[0.2em] text-[#777]">Loading Archive...</p>
          </section>
        )}

        {!loading && recipes.length > 0 && (
          <section className="grid gap-8 md:grid-cols-2">
            {recipes.map((recipe, i) => (
              <motion.div
                key={recipe.documentId}
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: i * 0.1 }}
              >
                <RecipeCard recipe={recipe} variant="list" />
              </motion.div>
            ))}
          </section>
        )}

        {!loading && recipes.length === 0 && (
          <section className="glass-card px-6 py-32 text-center mt-12">
            <div className="mx-auto flex size-24 items-center justify-center rounded-full bg-[#111] text-[#EAE8E3] mb-8">
              <Bookmark className="size-8" />
            </div>
            <h2 className="font-display text-5xl md:text-6xl text-[#111] mb-6">
              No saved recipes yet.
            </h2>
            <p className="mx-auto text-lg text-[#555] font-light max-w-xl mb-12">
              Explore recipes and start building a collection that feels more like a
              journal than a bookmark list.
            </p>
            <div className="flex flex-col sm:flex-row justify-center gap-6">
              <Link href="/dashboard" className="glass-pill bg-[#222] text-white px-8 py-4 text-xs font-semibold uppercase tracking-[0.2em] hover:bg-[#111] transition-colors flex items-center gap-3">
                <ChefHat className="size-4" />
                Explore
              </Link>
              <Link href="/pantry" className="glass-pill px-8 py-4 text-xs font-semibold uppercase tracking-[0.2em] text-[#222] hover:bg-white/50 transition-colors flex items-center gap-3">
                Check Pantry <ArrowRight className="size-4" />
              </Link>
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
