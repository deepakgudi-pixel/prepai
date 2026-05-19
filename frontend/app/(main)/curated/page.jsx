import React from "react";
import { ArrowRight } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import {
  getRecipeOfTheDay,
  getCategories,
} from "@/actions/mealdb.actions";
import { getCategoryEmoji } from "@/lib/data";

export default async function CuratedPage() {
  const recipeData = await getRecipeOfTheDay();
  const categoriesData = await getCategories();

  const recipeOfTheDay = recipeData?.recipe;
  const categories = categoriesData?.categories || [];

  return (
    <div className="bg-[#EAE8E3] pb-32">
      {/* Curated Header */}
      <section className="mx-auto max-w-[1400px] px-4 pb-12 pt-32 sm:px-12 lg:px-20">
        <p className="eyebrow mb-6">Discovery</p>
        <h1 className="display-title mb-8">
          Inspiration for <br/> <span className="italic text-[#777]">tonight.</span>
        </h1>
        
        <div className="mt-10 flex flex-col gap-4 sm:mt-12 sm:flex-row sm:gap-6">
           <div className="glass-pill px-6 py-4 flex gap-4 items-center">
              <span className="text-xs uppercase tracking-[0.2em] text-[#777]">Collections</span>
              <span className="font-display text-2xl">{categories.length}</span>
           </div>
           <div className="glass-pill px-6 py-4 flex gap-4 items-center">
              <span className="text-xs uppercase tracking-[0.2em] text-[#777]">Curated</span>
              <span className="font-display text-2xl">Daily</span>
           </div>
        </div>
      </section>

      {/* Featured Recipe */}
      {recipeOfTheDay && (
        <section className="mx-auto mb-20 max-w-[1400px] px-4 sm:mb-32 sm:px-12 lg:px-20">
           <Link
             href={`/recipe?cook=${encodeURIComponent(recipeOfTheDay.strMeal)}`}
             className="group relative block h-[420px] w-full overflow-hidden rounded-3xl sm:h-[600px]"
           >
              <Image
                src={recipeOfTheDay.strMealThumb}
                alt={recipeOfTheDay.strMeal}
                fill
                className="object-cover transition-transform duration-[1.5s] group-hover:scale-105"
                priority
              />
              <div className="absolute inset-0 bg-black/40 group-hover:bg-black/50 transition-colors duration-700" />
              
              <div className="absolute inset-0 flex flex-col justify-end p-5 sm:p-16">
                <div className="max-w-2xl">
                  <div className="mb-5 flex flex-wrap gap-3 sm:mb-6 sm:gap-4">
                    <span className="glass-pill border-white/20 bg-black/30 px-3 py-2 text-[0.65rem] uppercase tracking-[0.16em] text-[#EAE8E3] sm:px-4 sm:text-xs sm:tracking-[0.2em]">
                      {recipeOfTheDay.strCategory}
                    </span>
                    <span className="glass-pill border-white/20 bg-black/30 px-3 py-2 text-[0.65rem] uppercase tracking-[0.16em] text-[#EAE8E3] sm:px-4 sm:text-xs sm:tracking-[0.2em]">
                      {recipeOfTheDay.strArea}
                    </span>
                  </div>
                  <h2 className="mb-6 break-words font-display text-4xl leading-none text-[#EAE8E3] sm:text-7xl">
                    {recipeOfTheDay.strMeal}
                  </h2>
                  <div className="flex items-center gap-4 text-[#EAE8E3]">
                     <span className="text-sm font-light uppercase tracking-[0.1em]">Read Recipe</span>
                     <div className="size-10 rounded-full border border-white/30 flex items-center justify-center group-hover:bg-white group-hover:text-[#222] transition-colors duration-500">
                       <ArrowRight className="size-4" />
                     </div>
                  </div>
                </div>
              </div>
           </Link>
        </section>
      )}

      {/* Categories Grid */}
      <section className="mx-auto max-w-[1400px] px-4 sm:px-12 lg:px-20">
        <div className="mb-10 flex flex-col items-start justify-between gap-4 md:mb-16 md:flex-row md:items-end">
          <div>
            <p className="eyebrow mb-4">Browse</p>
            <h2 className="font-display text-4xl sm:text-5xl">Collections</h2>
          </div>
          <p className="text-[#777] font-light max-w-sm">Jump straight into a shelf of familiar formats: breakfast, pasta, vegan, and more.</p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 sm:gap-6">
          {categories.map((category) => (
            <Link
              key={category.strCategory}
              href={`/recipes/category/${category.strCategory.toLowerCase()}`}
              className="glass-card group p-6 sm:p-8 flex flex-col items-center justify-center text-center hover:bg-white/60 transition-all duration-500"
            >
              <span className="text-4xl mb-6 transform group-hover:scale-110 transition-transform duration-500">
                {getCategoryEmoji(category.strCategory)}
              </span>
              <h3 className="font-display text-2xl text-[#111] mb-2">
                {category.strCategory}
              </h3>
              <p className="text-[0.65rem] uppercase tracking-[0.2em] text-[#777]">
                View All
              </p>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
