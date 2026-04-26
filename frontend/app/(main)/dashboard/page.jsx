import React from "react";
import { ArrowRight, Globe2 } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";
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
    <div className="space-y-12 pb-8">
      <section className="border-b border-stone-200 bg-white">
        <div className="page-frame grid gap-10 py-12 lg:grid-cols-[0.9fr_1.1fr] lg:py-16">
          <div className="max-w-3xl">
            <p className="eyebrow">Recipe discovery</p>
            <h1 className="display-title mt-6">
              Explore meals by category, cuisine, or the best idea for tonight.
            </h1>
            <p className="section-copy mt-6">
              This is the browsing surface of PrepAI: less clutter, clearer entry
              points, and stronger emphasis on what to cook next.
            </p>

            <div className="mt-10 grid gap-4 sm:grid-cols-3">
              <div className="stat-card">
                <p className="text-xs uppercase tracking-[0.2em] text-stone-500">
                  Categories
                </p>
                <p className="mt-3 font-display text-4xl leading-none text-stone-950">
                  {categories.length}
                </p>
              </div>
              <div className="stat-card">
                <p className="text-xs uppercase tracking-[0.2em] text-stone-500">
                  Cuisines
                </p>
                <p className="mt-3 font-display text-4xl leading-none text-stone-950">
                  {areas.length}
                </p>
              </div>
              <div className="stat-card">
                <p className="text-xs uppercase tracking-[0.2em] text-stone-500">
                  Updated
                </p>
                <p className="mt-3 font-display text-4xl leading-none text-stone-950">
                  Daily
                </p>
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
                sizes="(max-width: 1024px) 100vw, 50vw"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/25 to-transparent" />
              <div className="absolute inset-x-0 bottom-0 p-5 sm:p-6">
                <div className="bg-white p-6">
                  <div className="flex flex-wrap gap-2 text-xs uppercase tracking-[0.2em] text-stone-500">
                    <span>{recipeOfTheDay.strCategory}</span>
                    <span>/</span>
                    <span>{recipeOfTheDay.strArea}</span>
                  </div>
                  <h2 className="mt-4 font-display text-4xl leading-none text-stone-950">
                    {recipeOfTheDay.strMeal}
                  </h2>
                  <p className="mt-4 line-clamp-3 text-sm leading-7 text-stone-600">
                    {recipeOfTheDay.strInstructions}
                  </p>
                  <div className="mt-6">
                    <Button variant="primary">
                      View full recipe
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
        <div className="mb-8 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="eyebrow">Browse</p>
            <h2 className="section-title mt-4">Categories</h2>
          </div>
          <p className="section-copy">
            Jump straight into a shelf of familiar formats: breakfast, pasta, vegan,
            dessert, and more.
          </p>
        </div>

        <div className="grid gap-px border border-stone-200 bg-stone-200 md:grid-cols-4 lg:grid-cols-7">
          {categories.map((category) => (
            <Link
              key={category.strCategory}
              href={`/recipes/category/${category.strCategory.toLowerCase()}`}
              className="group bg-white p-5"
            >
              <p className="text-3xl">{getCategoryEmoji(category.strCategory)}</p>
              <h3 className="mt-10 text-base font-semibold text-stone-950 group-hover:text-stone-700">
                {category.strCategory}
              </h3>
              <p className="mt-2 text-xs uppercase tracking-[0.2em] text-stone-500">
                Collection
              </p>
            </Link>
          ))}
        </div>
      </section>

      <section className="bg-stone-950 py-14 text-white">
        <div className="page-frame">
          <div className="mb-8 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="eyebrow text-stone-400">World cuisines</p>
              <h2 className="section-title mt-4 text-white">Cuisines</h2>
            </div>
            <p className="max-w-2xl text-base leading-7 text-stone-300">
              Browse regional starting points without the page becoming noisy or
              over-designed.
            </p>
          </div>

          <div className="grid gap-px border border-white/10 bg-white/10 md:grid-cols-4 lg:grid-cols-6">
            {areas.map((area) => (
              <Link
                key={area.strArea}
                href={`/recipes/cuisine/${area.strArea.toLowerCase().replace(/\s+/g, "-")}`}
                className="bg-stone-950 p-5 hover:bg-stone-900"
              >
                <div className="flex items-center justify-between gap-3">
                  <p className="text-3xl">{getCountryFlag(area.strArea)}</p>
                  <Globe2 className="size-4 text-stone-500" />
                </div>
                <h3 className="mt-8 text-base font-semibold text-white">{area.strArea}</h3>
                <p className="mt-2 text-xs uppercase tracking-[0.2em] text-stone-500">
                  Cuisine
                </p>
              </Link>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
