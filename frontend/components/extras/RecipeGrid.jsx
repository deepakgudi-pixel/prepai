"use client";

import { useEffect } from "react";
import { ArrowLeft, Loader2, Sparkles } from "lucide-react";
import Link from "next/link";
import useFetch from "@/hooks/use-fetch";
import RecipeCard from "./RecipeCard";

export default function RecipeGrid({
  type,
  value,
  fetchAction,
  backLink = "/curated",
}) {
  const { loading, data, fn: fetchMeals } = useFetch(fetchAction);

  useEffect(() => {
    if (value) {
      const formattedValue = value.charAt(0).toUpperCase() + value.slice(1);
      fetchMeals(formattedValue);
    }
  }, [value]);

  const meals = data?.meals || [];
  const displayName = value?.replace(/-/g, " ");

  return (
    <div className="page-frame pt-32 space-y-8">
      <section className="section-shell px-6 py-8 sm:px-8 sm:py-10">
        <Link
          href={backLink}
          className="nav-pill inline-flex items-center gap-2 hover:-translate-y-0.5"
        >
          <ArrowLeft className="size-4" />
          Back to Curated
        </Link>

        <div className="mt-8 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="eyebrow capitalize">
              <Sparkles className="size-3.5" />
              {type}
            </p>
            <h1 className="section-title mt-4 capitalize">
              {displayName} {type === "cuisine" ? "Cuisine" : "Recipes"}
            </h1>
          </div>

          {!loading && meals.length > 0 && (
            <p className="section-copy">
              {meals.length} refined {displayName}{" "}
              {type === "cuisine" ? "dishes" : "recipes"} ready to explore.
            </p>
          )}
        </div>
      </section>

      {loading && (
        <div className="section-shell flex flex-col items-center justify-center px-6 py-20 text-center">
          <Loader2 className="size-10 animate-spin text-emerald-900" />
          <p className="mt-4 text-stone-600">Loading recipes...</p>
        </div>
      )}

      {!loading && meals.length > 0 && (
        <section className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {meals.map((meal) => (
            <RecipeCard key={meal.idMeal} recipe={meal} variant="grid" />
          ))}
        </section>
      )}

      {!loading && meals.length === 0 && (
        <section className="section-shell px-6 py-20 text-center sm:px-8">
          <p className="font-display text-5xl text-stone-950">No recipes found.</p>
          <p className="mx-auto mt-4 max-w-lg text-stone-600">
            We couldn&apos;t find any {displayName}{" "}
            {type === "cuisine" ? "dishes" : "recipes"} right now.
          </p>
          <Link
            href={backLink}
            className="nav-pill mt-8 inline-flex items-center gap-2"
          >
            <ArrowLeft className="size-4" />
            Explore another collection
          </Link>
        </section>
      )}
    </div>
  );
}
