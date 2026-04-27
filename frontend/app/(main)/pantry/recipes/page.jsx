"use client";

import { getRecipesByPantryIngredients } from "@/actions/recipe.actions";
import { useUser } from "@clerk/nextjs";
import RecipeCard from "@/components/extras/RecipeCard";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import useFetch from "@/hooks/use-fetch";
import {
  AlertCircle,
  ArrowLeft,
  ChefHat,
  Loader2,
  Package,
  Sparkles,
  TrendingUp,
} from "lucide-react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import React, { Suspense, useEffect, useMemo } from "react";

function PantryRecipesContent() {
  const { user, isLoaded } = useUser();
  const searchParams = useSearchParams();
  const diet = searchParams.get("diet") || "all";
  const {
    loading,
    data: recipesData,
    fn: fetchSuggestions,
  } = useFetch(getRecipesByPantryIngredients);

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

    fetchSuggestions(authUser, diet);
  }, [isLoaded, authUser, diet]);

  const recipes = recipesData?.recipes || [];
  const ingredientsUsed = recipesData?.ingredientsUsed || "";

  return (
    <div className="page-frame space-y-8">
      <section className="grid gap-6 lg:grid-cols-[0.85fr_1.15fr]">
        <div className="section-shell px-6 py-8 sm:px-8 sm:py-10">
          <Link
            href="/pantry"
            className="nav-pill inline-flex items-center gap-2 hover:-translate-y-0.5"
          >
            <ArrowLeft className="size-4" />
            Back to Pantry
          </Link>

          <div className="mt-8">
            <p className="eyebrow">
              <ChefHat className="size-3.5" />
              AI suggestions
            </p>
            <h1 className="section-title mt-4">Recipes built from what you already have.</h1>
            <p className="section-copy mt-4">
              This is the practical magic moment in the app: pantry inventory becomes
              usable dinner direction.
            </p>
          </div>
        </div>

        <div className="panel-dark px-6 py-8 sm:px-8">
          <div className="flex items-center gap-3">
            <TrendingUp className="size-5 text-emerald-300" />
            <p className="text-sm uppercase tracking-[0.22em] text-stone-300">
              Ingredient snapshot
            </p>
          </div>
          <h2 className="mt-4 font-display text-5xl leading-none text-white">
            Your current pantry context.
          </h2>
          <div className="mt-6 rounded-[22px] border border-white/10 bg-white/7 p-5">
            <div className="flex items-start gap-3">
              <Package className="mt-1 size-5 shrink-0 text-emerald-300" />
              <p className="text-sm leading-7 text-stone-200">
                {ingredientsUsed || "We’re reading your pantry and composing suggestions now."}
              </p>
            </div>
          </div>
        </div>
      </section>

      {loading && (
        <section className="section-shell flex flex-col items-center justify-center px-6 py-20 text-center">
          <Loader2 className="size-10 animate-spin text-emerald-900" />
          <h2 className="mt-5 font-display text-5xl leading-none text-stone-950">
            Finding perfect recipes
          </h2>
          <p className="mt-4 text-stone-600">
            Our AI chef is analyzing your ingredients.
          </p>
        </section>
      )}

      {!loading && recipes.length > 0 && (
        <section className="space-y-6">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="eyebrow">Suggestions</p>
              <h2 className="section-title mt-4">Best-fit dishes right now.</h2>
            </div>
            <Badge variant="outline" className="rounded-full px-4 py-2">
              {recipes.length} {recipes.length === 1 ? "recipe" : "recipes"}
            </Badge>
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            {recipes.map((recipe, index) => (
              <RecipeCard key={index} recipe={recipe} variant="pantry" />
            ))}
          </div>

          <div className="text-center">
            <Button
              onClick={() => fetchSuggestions(authUser, diet)}
              variant="outline"
              size="lg"
              disabled={loading}
            >
              {loading ? (
                <>
                  <Loader2 className="size-4 animate-spin" />
                  Loading...
                </>
              ) : (
                <>
                  <Sparkles className="size-4" />
                  Get New Suggestions
                </>
              )}
            </Button>
          </div>
        </section>
      )}

      {!loading && recipes.length === 0 && recipesData?.success === false && (
        <section className="section-shell px-6 py-20 text-center sm:px-8">
          <div className="mx-auto flex size-20 items-center justify-center rounded-full bg-stone-950 text-white">
            <AlertCircle className="size-10" />
          </div>
          <h2 className="mt-8 font-display text-5xl leading-none text-stone-950">
            Your pantry needs a few ingredients first.
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-base leading-7 text-stone-600">
            Add ingredients so we can generate relevant recipe suggestions instead of
            generic inspiration.
          </p>
          <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
            <Link href="/pantry">
              <Button variant="primary" size="lg">
                Add Ingredients
              </Button>
            </Link>
          </div>
        </section>
      )}
    </div>
  );
}

export default function PantryRecipesPage() {
  return (
    <Suspense
      fallback={
        <div className="page-frame">
          <section className="section-shell flex flex-col items-center justify-center px-6 py-20 text-center">
            <Loader2 className="size-10 animate-spin text-emerald-900" />
            <h2 className="mt-5 font-display text-5xl leading-none text-stone-950">
              Finding perfect recipes
            </h2>
            <p className="mt-4 text-stone-600">
              Our AI chef is analyzing your ingredients.
            </p>
          </section>
        </div>
      }
    >
      <PantryRecipesContent />
    </Suspense>
  );
}
