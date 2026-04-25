import React from "react";
import { Globe2, ArrowRight, Flame, Sparkles } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  getRecipeOfTheDay,
  getCategories,
  getAreas,
} from "@/actions/mealdb.actions";
import { getCategoryEmoji, getCountryFlag } from "@/lib/data";

export default async function DashboardPage() {
  const recipeData = await getRecipeOfTheDay();
  const categoriesData = await getCategories();
  const areasData = await getAreas();

  const recipeOfTheDay = recipeData?.recipe;
  const categories = categoriesData?.categories || [];
  const areas = areasData?.areas || [];

  return (
    <div className="space-y-8">
      <section className="page-frame">
        <div className="grid gap-6 lg:grid-cols-[0.95fr_1.05fr]">
          <div className="section-shell px-6 py-8 sm:px-8 sm:py-10">
            <p className="eyebrow">
              <Sparkles className="size-3.5" />
              Curated discovery
            </p>
            <h1 className="display-title mt-6 max-w-3xl">
              Fresh ideas for the kitchen you actually have.
            </h1>
            <p className="section-copy mt-6">
              Browse by mood, cuisine, or category and let the app feel more like a
              curated food journal than a utility dashboard.
            </p>

            <div className="mt-10 grid gap-4 sm:grid-cols-3">
              <div className="stat-card">
                <p className="text-xs uppercase tracking-[0.22em] text-stone-500">Collections</p>
                <p className="mt-3 font-display text-5xl leading-none text-stone-950">
                  {categories.length}
                </p>
                <p className="mt-2 text-sm text-stone-600">recipe categories</p>
              </div>
              <div className="stat-card">
                <p className="text-xs uppercase tracking-[0.22em] text-stone-500">Destinations</p>
                <p className="mt-3 font-display text-5xl leading-none text-stone-950">
                  {areas.length}
                </p>
                <p className="mt-2 text-sm text-stone-600">world cuisines</p>
              </div>
              <div className="stat-card">
                <p className="text-xs uppercase tracking-[0.22em] text-stone-500">Today</p>
                <p className="mt-3 font-display text-5xl leading-none text-stone-950">01</p>
                <p className="mt-2 text-sm text-stone-600">featured editor&apos;s pick</p>
              </div>
            </div>
          </div>

          {recipeOfTheDay && (
            <Link
              href={`/recipe?cook=${encodeURIComponent(recipeOfTheDay.strMeal)}`}
              className="hero-media min-h-[560px] group"
            >
              <Image
                src={recipeOfTheDay.strMealThumb}
                alt={recipeOfTheDay.strMeal}
                fill
                className="object-cover transition-transform duration-700 group-hover:scale-105"
                sizes="(max-width: 1024px) 100vw, 48vw"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/25 to-transparent" />
              <div className="absolute left-5 top-5">
                <Badge className="rounded-full bg-white/15 px-4 py-2 text-white backdrop-blur">
                  <Flame className="mr-2 size-4" />
                  Recipe of the day
                </Badge>
              </div>
              <div className="absolute inset-x-0 bottom-0 p-5 sm:p-7">
                <div className="panel-surface bg-white/88 p-6">
                  <div className="flex flex-wrap gap-2 text-xs uppercase tracking-[0.2em] text-stone-500">
                    <span>{recipeOfTheDay.strCategory}</span>
                    <span>/</span>
                    <span>{recipeOfTheDay.strArea}</span>
                  </div>
                  <h2 className="mt-3 font-display text-5xl leading-none text-stone-950">
                    {recipeOfTheDay.strMeal}
                  </h2>
                  <p className="mt-4 line-clamp-3 text-base leading-7 text-stone-700">
                    {recipeOfTheDay.strInstructions}
                  </p>
                  <div className="mt-6">
                    <Button variant="primary">
                      View Full Recipe
                      <ArrowRight className="size-4" />
                    </Button>
                  </div>
                </div>
              </div>
            </Link>
          )}
        </div>
      </section>

      <section className="page-frame">
        <div className="section-shell px-6 py-8 sm:px-8">
          <div className="mb-8 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="eyebrow">Categories</p>
              <h2 className="section-title mt-4">Browse by category.</h2>
            </div>
            <p className="section-copy">
              Jump into a visual shelf of dishes that feels curated, fast, and tactile.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4 md:grid-cols-4 lg:grid-cols-7">
            {categories.map((category) => (
              <Link
                key={category.strCategory}
                href={`/recipes/category/${category.strCategory.toLowerCase()}`}
                className="panel-surface group flex min-h-36 flex-col justify-between p-5 hover:-translate-y-1"
              >
                <span className="text-4xl">{getCategoryEmoji(category.strCategory)}</span>
                <div>
                  <p className="text-xs uppercase tracking-[0.22em] text-stone-500">
                    collection
                  </p>
                  <h3 className="mt-2 text-lg font-semibold text-stone-950 group-hover:text-emerald-900">
                    {category.strCategory}
                  </h3>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="page-frame pb-4">
        <div className="panel-dark px-6 py-8 sm:px-8">
          <div className="mb-8 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="eyebrow border-white/10 bg-white/5 text-stone-200">
                World cuisine
              </p>
              <h2 className="section-title mt-4 text-white">Explore world cuisines.</h2>
            </div>
            <p className="max-w-2xl text-base leading-7 text-stone-300">
              Pick a country and move through the menu like you’re flipping through a
              premium food atlas.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4 md:grid-cols-4 lg:grid-cols-6">
            {areas.map((area) => (
              <Link
                key={area.strArea}
                href={`/recipes/cuisine/${area.strArea.toLowerCase().replace(/\s+/g, "-")}`}
                className="rounded-[22px] border border-white/10 bg-white/6 p-5 hover:-translate-y-1 hover:bg-white/10"
              >
                <p className="text-3xl">{getCountryFlag(area.strArea)}</p>
                <div className="mt-6 flex items-center justify-between gap-3">
                  <h3 className="text-base font-semibold text-white">{area.strArea}</h3>
                  <Globe2 className="size-4 text-stone-400" />
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
