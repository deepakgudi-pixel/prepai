import Link from "next/link";
import Image from "next/image";
import { Clock3, Users, ChefHat, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

const getMatchTone = (percentage) => {
  if (percentage >= 90) return "bg-emerald-900 text-white";
  if (percentage >= 75) return "bg-amber-500 text-stone-950";
  return "bg-stone-800 text-white";
};

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
  const totalTime =
    parseInt(data.prepTime || 0, 10) + parseInt(data.cookTime || 0, 10);

  if (variant === "grid") {
    return (
      <Link href={data.href} className="group">
        <article className="panel-surface overflow-hidden pt-0 hover:-translate-y-1">
          <div className="relative aspect-[0.9] overflow-hidden">
            {data.showImage ? (
              <Image
                src={data.image}
                alt={data.title}
                fill
                className="object-cover transition-transform duration-700 group-hover:scale-105"
                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 25vw"
              />
            ) : (
              <div className="flex h-full items-center justify-center bg-[linear-gradient(135deg,#20493f,#e39d37)]">
                <ChefHat className="size-16 text-white/40" />
              </div>
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/5 to-transparent" />
            <div className="absolute inset-x-0 bottom-0 p-5">
              <p className="text-xs uppercase tracking-[0.22em] text-stone-200">
                recipe
              </p>
              <h3 className="mt-2 font-display text-4xl leading-none text-white">
                {data.title}
              </h3>
            </div>
          </div>
        </article>
      </Link>
    );
  }

  if (variant === "pantry") {
    return (
      <article className="panel-surface flex h-full flex-col overflow-hidden pt-0">
        {data.showImage && (
          <div className="relative aspect-[16/10] overflow-hidden">
            <Image
              src={data.image}
              alt={data.title}
              fill
              className="object-cover"
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent" />
            {data.matchPercentage && (
              <Badge
                className={`absolute right-4 top-4 rounded-full px-4 py-2 ${getMatchTone(
                  data.matchPercentage,
                )}`}
              >
                {data.matchPercentage}% match
              </Badge>
            )}
          </div>
        )}

        <div className="flex flex-1 flex-col p-6">
          <div className="flex flex-wrap gap-2">
            {data.cuisine && (
              <Badge variant="outline" className="rounded-full capitalize">
                {data.cuisine}
              </Badge>
            )}
            {data.category && (
              <Badge
                variant="outline"
                className="rounded-full border-stone-900/10 capitalize"
              >
                {data.category}
              </Badge>
            )}
            {!data.showImage && data.matchPercentage && (
              <Badge className={`rounded-full px-4 py-2 ${getMatchTone(data.matchPercentage)}`}>
                {data.matchPercentage}% match
              </Badge>
            )}
          </div>

          <h3 className="mt-5 font-display text-4xl leading-none text-stone-950">
            {data.title}
          </h3>

          {data.description && (
            <p className="mt-4 text-base leading-7 text-stone-700">
              {data.description}
            </p>
          )}

          {(totalTime || data.servings) && (
            <div className="mt-5 flex flex-wrap gap-3 text-sm text-stone-600">
              {totalTime > 0 && (
                <span className="nav-pill flex items-center gap-2">
                  <Clock3 className="size-4" />
                  {totalTime} mins
                </span>
              )}
              {data.servings && (
                <span className="nav-pill flex items-center gap-2">
                  <Users className="size-4" />
                  {data.servings} servings
                </span>
              )}
            </div>
          )}

          {data.missingIngredients && data.missingIngredients.length > 0 && (
            <div className="mt-6 rounded-[20px] border border-stone-900/8 bg-stone-950/[0.03] p-4">
              <p className="text-xs uppercase tracking-[0.2em] text-stone-500">
                You&apos;ll need
              </p>
              <div className="mt-3 flex flex-wrap gap-2">
                {data.missingIngredients.map((ingredient, index) => (
                  <Badge
                    key={`${ingredient}-${index}`}
                    variant="outline"
                    className="rounded-full bg-white/75"
                  >
                    {ingredient}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          <div className="mt-6">
            <Link href={data.href}>
              <Button variant="primary" className="w-full">
                View Full Recipe
                <ArrowRight className="size-4" />
              </Button>
            </Link>
          </div>
        </div>
      </article>
    );
  }

  if (variant === "list") {
    return (
      <Link href={data.href} className="group">
        <article className="panel-surface overflow-hidden pt-0 hover:-translate-y-1">
          <div className="flex flex-col md:flex-row">
            <div className="relative aspect-[16/10] w-full overflow-hidden md:w-56 md:aspect-square">
              {data.showImage ? (
                <Image
                  src={data.image}
                  alt={data.title}
                  fill
                  className="object-cover transition-transform duration-700 group-hover:scale-105"
                  sizes="(max-width: 768px) 100vw, 224px"
                />
              ) : (
                <div className="flex h-full items-center justify-center bg-[linear-gradient(135deg,#20493f,#e39d37)]">
                  <ChefHat className="size-12 text-white/40" />
                </div>
              )}
            </div>

            <div className="flex flex-1 flex-col p-6">
              <div className="flex flex-wrap gap-2">
                {data.cuisine && (
                  <Badge variant="outline" className="rounded-full capitalize">
                    {data.cuisine}
                  </Badge>
                )}
                {data.category && (
                  <Badge
                    variant="outline"
                    className="rounded-full border-stone-900/10 capitalize"
                  >
                    {data.category}
                  </Badge>
                )}
              </div>

              <h3 className="mt-5 font-display text-4xl leading-none text-stone-950">
                {data.title}
              </h3>
              {data.description && (
                <p className="mt-4 line-clamp-2 text-base leading-7 text-stone-700">
                  {data.description}
                </p>
              )}

              {(totalTime || data.servings) && (
                <div className="mt-5 flex flex-wrap gap-3 text-sm text-stone-600">
                  {totalTime > 0 && (
                    <span className="nav-pill flex items-center gap-2">
                      <Clock3 className="size-4" />
                      {totalTime} mins
                    </span>
                  )}
                  {data.servings && (
                    <span className="nav-pill flex items-center gap-2">
                      <Users className="size-4" />
                      {data.servings} servings
                    </span>
                  )}
                </div>
              )}
            </div>
          </div>
        </article>
      </Link>
    );
  }

  return (
    <Link href={data.href}>
      <article className="panel-surface overflow-hidden pt-0">
        {data.showImage && (
          <div className="relative aspect-video">
            <Image
              src={data.image}
              alt={data.title}
              fill
              className="object-cover"
              sizes="(max-width: 768px) 100vw, 400px"
            />
          </div>
        )}
        <div className="p-6">
          <h3 className="font-display text-3xl leading-none text-stone-950">
            {data.title}
          </h3>
          {data.description && (
            <p className="mt-3 line-clamp-2 text-stone-700">{data.description}</p>
          )}
        </div>
      </article>
    </Link>
  );
}
