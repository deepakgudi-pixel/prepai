"use client";

import { useEffect } from "react";
import { Bookmark, Loader2, ChefHat } from "lucide-react";
import Link from "next/link";
import RecipeCard from "@/components/extras/RecipeCard";
import useFetch from "@/hooks/use-fetch";
import { getSavedRecipes } from "@/actions/recipe.actions";
import { Button } from "@/components/ui/button";

export default function SavedRecipesPage() {
  const {
    loading,
    data: recipesData,
    fn: fetchSavedRecipes,
  } = useFetch(getSavedRecipes);

  useEffect(() => {
    fetchSavedRecipes();
  }, []);

  const recipes = recipesData?.recipes || [];

  return (
    <div className="page-frame space-y-8">
      <section className="section-shell px-6 py-8 sm:px-8 sm:py-10">
        <div className="flex items-start gap-4">
          <span className="flex size-16 items-center justify-center rounded-full bg-stone-950 text-white shadow-[0_16px_34px_rgba(24,22,18,0.22)]">
            <Bookmark className="size-8" />
          </span>
          <div>
            <p className="eyebrow">Saved recipes</p>
            <h1 className="section-title mt-4">Your personal cookbook.</h1>
            <p className="section-copy mt-4">
              Keep the recipes worth returning to in a cleaner, calmer archive.
            </p>
          </div>
        </div>
      </section>

      {loading && (
        <section className="section-shell flex flex-col items-center justify-center px-6 py-20">
          <Loader2 className="size-10 animate-spin text-emerald-900" />
          <p className="mt-4 text-stone-600">Loading your saved recipes...</p>
        </section>
      )}

      {!loading && recipes.length > 0 && (
        <section className="grid gap-6 md:grid-cols-2">
          {recipes.map((recipe) => (
            <RecipeCard key={recipe.documentId} recipe={recipe} variant="list" />
          ))}
        </section>
      )}

      {!loading && recipes.length === 0 && (
        <section className="section-shell px-6 py-20 text-center sm:px-8">
          <div className="mx-auto flex size-20 items-center justify-center rounded-full bg-emerald-950 text-white shadow-[0_18px_36px_rgba(20,97,78,0.2)]">
            <Bookmark className="size-10" />
          </div>
          <h2 className="mt-8 font-display text-5xl leading-none text-stone-950">
            No saved recipes yet.
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-base leading-7 text-stone-600">
            Explore recipes and start building a collection that feels more like a
            journal than a bookmark list.
          </p>
          <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
            <Link href="/dashboard">
              <Button variant="primary" size="lg">
                <ChefHat className="size-4" />
                Explore Recipes
              </Button>
            </Link>
            <Link href="/pantry">
              <Button variant="outline" size="lg">
                Check Pantry
              </Button>
            </Link>
          </div>
        </section>
      )}
    </div>
  );
}
