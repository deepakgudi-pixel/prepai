import React from "react";
import { ArrowRight } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import {
  getRecipeOfTheDay,
  getCategories,
} from "@/actions/mealdb.actions";
import { getCategoryEmoji } from "@/lib/data";

export default async function DashboardPage() {
  const recipeData = await getRecipeOfTheDay();
  const categoriesData = await getCategories();

  const recipeOfTheDay = recipeData?.recipe;
  const categories = categoriesData?.categories || [];

  return (
    <div className="bg-[#EAE8E3] pb-32">
      {/* Dashboard Header */}
      <section className="pt-32 pb-12 px-6 sm:px-12 lg:px-20 max-w-[1400px] mx-auto">
        <p className="eyebrow mb-6">Discovery</p>
        <h1 className="display-title mb-8">
          Inspiration for <br/> <span className="italic text-[#777]">tonight.</span>
        </h1>
        
        <div className="flex flex-col sm:flex-row gap-6 mt-12">
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
        <section className="px-6 sm:px-12 lg:px-20 max-w-[1400px] mx-auto mb-32">
           <Link
             href={`/recipe?cook=${encodeURIComponent(recipeOfTheDay.strMeal)}`}
             className="group block relative w-full h-[600px] rounded-3xl overflow-hidden"
           >
              <Image
                src={recipeOfTheDay.strMealThumb}
                alt={recipeOfTheDay.strMeal}
                fill
                className="object-cover transition-transform duration-[1.5s] group-hover:scale-105"
                priority
              />
              <div className="absolute inset-0 bg-black/40 group-hover:bg-black/50 transition-colors duration-700" />
              
              <div className="absolute inset-0 p-8 sm:p-16 flex flex-col justify-end">
                <div className="max-w-2xl">
                  <div className="flex gap-4 mb-6">
                    <span className="glass-pill px-4 py-2 text-xs uppercase tracking-[0.2em] text-[#EAE8E3] bg-black/30 border-white/20">
                      {recipeOfTheDay.strCategory}
                    </span>
                    <span className="glass-pill px-4 py-2 text-xs uppercase tracking-[0.2em] text-[#EAE8E3] bg-black/30 border-white/20">
                      {recipeOfTheDay.strArea}
                    </span>
                  </div>
                  <h2 className="font-display text-5xl sm:text-7xl text-[#EAE8E3] mb-6">
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
      <section className="px-6 sm:px-12 lg:px-20 max-w-[1400px] mx-auto">
        <div className="flex flex-col md:flex-row justify-between items-end mb-16">
          <div>
            <p className="eyebrow mb-4">Browse</p>
            <h2 className="font-display text-5xl">Collections</h2>
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
