import Link from "next/link";
import Image from "next/image";
import { ArrowRight, ChefHat, Clock3, Users } from "lucide-react";

export default function RecipeCard({ recipe, variant = "default" }) {
  const getRecipeData = () => {
    if (recipe.strMeal) {
      return {
        title: recipe.strMeal,
        image: recipe.strMealThumb,
        href: `/recipe?cook=${encodeURIComponent(recipe.strMeal)}`,
        showImage: true,
      };
    }

    if (recipe.matchPercentage) {
      return {
        title: recipe.title,
        description: recipe.description,
        category: recipe.category,
        cuisine: recipe.cuisine,
        prepTime: recipe.prepTime,
        cookTime: recipe.cookTime,
        servings: recipe.servings,
        matchPercentage: recipe.matchPercentage,
        missingIngredients: recipe.missingIngredients || [],
        image: recipe.imageUrl,
        href: `/recipe?cook=${encodeURIComponent(recipe.title)}`,
        showImage: !!recipe.imageUrl,
      };
    }

    if (recipe) {
      return {
        title: recipe.title,
        description: recipe.description,
        category: recipe.category,
        cuisine: recipe.cuisine,
        prepTime: recipe.prepTime,
        cookTime: recipe.cookTime,
        servings: recipe.servings,
        image: recipe.imageUrl,
        href: `/recipe?cook=${encodeURIComponent(recipe.title)}`,
        showImage: !!recipe.imageUrl,
      };
    }

    return {};
  };

  const data = getRecipeData();
  const totalTime = parseInt(data.prepTime || 0, 10) + parseInt(data.cookTime || 0, 10);

  if (variant === "grid") {
    return (
      <Link href={data.href} className="group block h-full">
        <article className="glass-card flex flex-col h-full overflow-hidden hover:border-[#aaa] transition-colors duration-500">
          <div className="relative aspect-[4/5] overflow-hidden rounded-t-3xl">
            {data.showImage ? (
              <Image
                src={data.image}
                alt={data.title}
                fill
                className="object-cover transition-transform duration-[1.5s] group-hover:scale-105"
                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 25vw"
              />
            ) : (
              <div className="flex h-full items-center justify-center bg-white/50">
                <ChefHat className="size-16 text-[#aaa]" />
              </div>
            )}
          </div>
          <div className="p-8 flex flex-col flex-1 justify-between">
            <div>
              <p className="text-[0.65rem] uppercase tracking-[0.2em] text-[#777]">Recipe</p>
              <h3 className="mt-4 font-display text-4xl leading-none text-[#111] group-hover:text-[#555] transition-colors">
                {data.title}
              </h3>
            </div>
            <div className="mt-8 flex justify-end opacity-0 group-hover:opacity-100 transition-opacity duration-500 -translate-x-4 group-hover:translate-x-0">
               <span className="size-10 rounded-full border border-[#D5D3CE] bg-white flex items-center justify-center">
                 <ArrowRight className="size-4 text-[#111]" />
               </span>
            </div>
          </div>
        </article>
      </Link>
    );
  }

  if (variant === "list") {
    return (
      <Link href={data.href} className="group block">
        <article className="glass-card overflow-hidden hover:border-[#aaa] transition-colors duration-500">
          <div className="flex flex-col md:flex-row h-full">
            <div className="relative aspect-[16/10] w-full overflow-hidden md:w-64 md:aspect-[3/4] shrink-0 rounded-t-3xl md:rounded-l-3xl md:rounded-tr-none">
              {data.showImage ? (
                <Image
                  src={data.image}
                  alt={data.title}
                  fill
                  className="object-cover transition-transform duration-[1.5s] group-hover:scale-105"
                  sizes="(max-width: 768px) 100vw, 256px"
                />
              ) : (
                <div className="flex h-full items-center justify-center bg-white/50">
                  <ChefHat className="size-12 text-[#aaa]" />
                </div>
              )}
            </div>

            <div className="flex flex-1 flex-col p-8 sm:p-10 justify-between">
              <div>
                <div className="flex flex-wrap gap-2 mb-6">
                  {data.cuisine && (
                    <span className="glass-pill px-4 py-2 text-[0.65rem] uppercase tracking-[0.2em] text-[#555]">
                      {data.cuisine}
                    </span>
                  )}
                  {data.category && (
                    <span className="glass-pill px-4 py-2 text-[0.65rem] uppercase tracking-[0.2em] text-[#555]">
                      {data.category}
                    </span>
                  )}
                </div>

                <h3 className="font-display text-4xl sm:text-5xl leading-none text-[#111] group-hover:text-[#555] transition-colors">
                  {data.title}
                </h3>
                
                {data.description && (
                  <p className="mt-6 line-clamp-3 text-lg font-light text-[#555] leading-relaxed">
                    {data.description}
                  </p>
                )}
              </div>

              <div className="mt-10 flex flex-wrap items-center justify-between gap-4">
                <div className="flex flex-wrap gap-4 text-sm text-[#777] font-light">
                  {totalTime > 0 && (
                    <span className="flex items-center gap-2">
                      <Clock3 className="size-4" /> {totalTime} mins
                    </span>
                  )}
                  {data.servings && (
                    <span className="flex items-center gap-2">
                      <Users className="size-4" /> {data.servings} portions
                    </span>
                  )}
                </div>
                
                <span className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.2em] text-[#111] opacity-0 group-hover:opacity-100 transition-all duration-500 translate-x-4 group-hover:translate-x-0">
                  Read <ArrowRight className="size-3" />
                </span>
              </div>
            </div>
          </div>
        </article>
      </Link>
    );
  }

  // default / pantry variant
  return (
    <Link href={data.href} className="group block h-full">
      <article className="glass-card flex flex-col h-full overflow-hidden hover:border-[#aaa] transition-colors duration-500">
        {data.showImage && (
          <div className="relative aspect-[16/10] overflow-hidden rounded-t-3xl">
            <Image
              src={data.image}
              alt={data.title}
              fill
              className="object-cover transition-transform duration-[1.5s] group-hover:scale-105"
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            />
            {data.matchPercentage && (
              <div className="absolute right-4 top-4 glass-pill bg-black/60 text-white border-white/20 px-4 py-2 text-[0.65rem] uppercase tracking-[0.2em]">
                {data.matchPercentage}% match
              </div>
            )}
          </div>
        )}

        <div className="flex flex-1 flex-col p-8 justify-between">
          <div>
            <div className="flex flex-wrap gap-2 mb-6">
              {data.cuisine && (
                <span className="glass-pill px-4 py-2 text-[0.65rem] uppercase tracking-[0.2em] text-[#555]">
                  {data.cuisine}
                </span>
              )}
              {data.category && (
                <span className="glass-pill px-4 py-2 text-[0.65rem] uppercase tracking-[0.2em] text-[#555]">
                  {data.category}
                </span>
              )}
              {!data.showImage && data.matchPercentage && (
                <span className="glass-pill px-4 py-2 text-[0.65rem] uppercase tracking-[0.2em] text-[#555]">
                  {data.matchPercentage}% match
                </span>
              )}
            </div>

            <h3 className="font-display text-4xl leading-none text-[#111] group-hover:text-[#555] transition-colors">
              {data.title}
            </h3>

            {data.description && (
              <p className="mt-4 text-lg font-light text-[#555] leading-relaxed line-clamp-3">
                {data.description}
              </p>
            )}
          </div>

          <div className="mt-8">
            {(totalTime || data.servings) && (
              <div className="flex flex-wrap gap-4 text-sm text-[#777] font-light mb-6 pb-6 border-b border-[#D5D3CE]">
                {totalTime > 0 && (
                  <span className="flex items-center gap-2">
                    <Clock3 className="size-4" /> {totalTime} mins
                  </span>
                )}
                {data.servings && (
                  <span className="flex items-center gap-2">
                    <Users className="size-4" /> {data.servings} portions
                  </span>
                )}
              </div>
            )}

            {data.missingIngredients && data.missingIngredients.length > 0 && (
              <div className="mb-6">
                <p className="text-[0.65rem] uppercase tracking-[0.2em] text-[#aaa] mb-3">
                  Missing
                </p>
                <div className="flex flex-wrap gap-2">
                  {data.missingIngredients.map((ingredient, index) => (
                    <span
                      key={`${ingredient}-${index}`}
                      className="text-xs font-medium text-[#777] border-b border-[#D5D3CE] pb-1"
                    >
                      {ingredient}
                    </span>
                  ))}
                </div>
              </div>
            )}

            <div className="flex justify-end opacity-0 group-hover:opacity-100 transition-opacity duration-500 -translate-x-4 group-hover:translate-x-0">
               <span className="size-10 rounded-full border border-[#D5D3CE] bg-white flex items-center justify-center">
                 <ArrowRight className="size-4 text-[#111]" />
               </span>
            </div>
          </div>
        </div>
      </article>
    </Link>
  );
}
