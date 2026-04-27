/* eslint-disable react-hooks/set-state-in-effect */
"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import {
  ArrowLeft,
  Clock3,
  Users,
  ChefHat,
  Flame,
  Lightbulb,
  Bookmark,
  BookmarkCheck,
  Loader2,
  AlertCircle,
  CheckCircle2,
  Download,
} from "lucide-react";
import Link from "next/link";
import useFetch from "@/hooks/use-fetch";
import { useUser } from "@clerk/nextjs";
import {
  getOrGenerateRecipe,
  removeRecipeFromCollection,
  saveRecipeToCollection,
} from "@/actions/recipe.actions";
import { toast } from "sonner";
import { ClockLoader } from "react-spinners";
import { Button } from "@/components/ui/button";
import { PDFDownloadLink } from "@react-pdf/renderer";
import { Badge } from "@/components/ui/badge";
import { RecipePDF } from "@/components/extras/RecipePDF";
import Image from "next/image";
import { useMemo } from "react";

function RecipeContent() {
  const { user, isLoaded } = useUser();
  const searchParams = useSearchParams();
  const router = useRouter();
  const recipeName = searchParams.get("cook");

  const [recipe, setRecipe] = useState(null);
  const [recipeId, setRecipeId] = useState(null);
  const [isSaved, setIsSaved] = useState(false);

  const { loading: loadingRecipe, data: recipeData, fn: fetchRecipe } =
    useFetch(getOrGenerateRecipe);
  const { loading: saving, data: saveData, fn: saveToCollection } =
    useFetch(saveRecipeToCollection);
  const { loading: removing, data: removeData, fn: removeFromCollection } =
    useFetch(removeRecipeFromCollection);

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
    if (!isLoaded || !recipeName || recipe) {
      return;
    }

    if (!authUser) {
      toast.error("Please sign in to generate and save recipes");
      return;
    }

    if (recipeName) {
      const formData = new FormData();
      formData.append("recipeName", recipeName);
      fetchRecipe(authUser, formData);
    }
  }, [isLoaded, recipeName, recipe, authUser]);

  useEffect(() => {
    if (recipeData?.success) {
      setRecipe(recipeData.recipe);
      setRecipeId(recipeData.recipeId);
      setIsSaved(recipeData.isSaved);

      if (recipeData.fromDatabase) {
        toast.success("Recipe loaded from database");
      } else if (recipeData.persisted === false) {
        toast.success("Recipe generated");
      } else {
        toast.success("New recipe generated and saved!");
      }
    }
  }, [recipeData]);

  useEffect(() => {
    if (saveData?.success) {
      if (saveData.alreadySaved) {
        toast.info("Recipe is already in your collection");
      } else {
        setIsSaved(true);
        toast.success("Recipe saved to your collection!");
      }
    }
  }, [saveData]);

  useEffect(() => {
    if (removeData?.success) {
      setIsSaved(false);
      toast.success("Recipe removed from collection");
    }
  }, [removeData]);

  const handleToggleSave = async () => {
    if (!recipeId) return;

    const formData = new FormData();
    formData.append("recipeId", recipeId);

    if (isSaved) {
      await removeFromCollection(authUser, formData);
    } else {
      await saveToCollection(authUser, formData);
    }
  };

  if (!recipeName) {
    return (
      <div className="page-frame">
        <div className="section-shell px-6 py-20 text-center sm:px-8">
          <div className="mx-auto flex size-20 items-center justify-center rounded-full bg-emerald-950 text-white">
            <AlertCircle className="size-10" />
          </div>
          <h2 className="mt-8 font-display text-5xl leading-none text-stone-950">
            No recipe specified.
          </h2>
          <p className="mt-4 text-stone-600">Please select a recipe from the dashboard.</p>
          <Link href="/dashboard">
            <Button variant="primary" size="lg" className="mt-8">
              Go to Dashboard
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  if (loadingRecipe === null || loadingRecipe) {
    return (
      <div className="page-frame">
        <div className="section-shell px-6 py-20 text-center sm:px-8">
          <ClockLoader className="mx-auto" color="#1d6f5f" />
          <h2 className="mt-8 font-display text-5xl leading-none text-stone-950">
            Preparing your recipe
          </h2>
          <p className="mt-4 text-stone-600">
            Our AI chef is crafting detailed instructions for{" "}
            <span className="font-semibold text-emerald-900">{recipeName}</span>.
          </p>
          <div className="mx-auto mt-8 max-w-md">
            <div className="relative h-1 overflow-hidden rounded-full bg-stone-200">
              <div className="animate-slow-fill absolute left-0 top-0 h-full bg-emerald-900" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (loadingRecipe === false && !recipe) {
    return (
      <div className="page-frame">
        <div className="section-shell px-6 py-20 text-center sm:px-8">
          <div className="mx-auto flex size-20 items-center justify-center rounded-full bg-red-600 text-white">
            <AlertCircle className="size-10" />
          </div>
          <h2 className="mt-8 font-display text-5xl leading-none text-stone-950">
            Failed to load recipe.
          </h2>
          <p className="mt-4 text-stone-600">
            Something went wrong while loading the recipe. Please try again.
          </p>
          <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
            <Button onClick={() => router.back()} variant="outline" size="lg">
              <ArrowLeft className="size-4" />
              Go Back
            </Button>
            <Button onClick={() => window.location.reload()} variant="primary" size="lg">
              Retry
            </Button>
          </div>
        </div>
      </div>
    );
  }

  const totalTime =
    parseInt(recipe.prepTime || 0, 10) + parseInt(recipe.cookTime || 0, 10);

  return (
    <div className="page-frame space-y-8">
      <section className="section-shell overflow-hidden pt-0">
        {recipe.imageUrl && (
          <div className="relative h-72 w-full overflow-hidden sm:h-96">
            <Image
              src={recipe.imageUrl}
              alt={recipe.title}
              fill
              className="object-cover"
              sizes="(max-width: 768px) 100vw, 1200px"
              priority
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/25 to-transparent" />
          </div>
        )}

        <div className="px-6 py-8 sm:px-8 sm:py-10">
          <Link
            href="/dashboard"
            className="nav-pill inline-flex items-center gap-2 hover:-translate-y-0.5"
          >
            <ArrowLeft className="size-4" />
            Back to Dashboard
          </Link>

          <div className="mt-8 flex flex-wrap gap-2">
            <Badge variant="outline" className="rounded-full capitalize">
              {recipe.cuisine}
            </Badge>
            <Badge variant="outline" className="rounded-full capitalize">
              {recipe.category}
            </Badge>
          </div>

          <h1 className="section-title mt-5">{recipe.title}</h1>
          <p className="section-copy mt-5 max-w-3xl">{recipe.description}</p>

          <div className="mt-6 flex flex-wrap gap-3 text-sm text-stone-600">
            <span className="nav-pill flex items-center gap-2">
              <Clock3 className="size-4" />
              {totalTime} mins total
            </span>
            <span className="nav-pill flex items-center gap-2">
              <Users className="size-4" />
              {recipe.servings} servings
            </span>
            {recipe.nutrition?.calories && (
              <span className="nav-pill flex items-center gap-2">
                <Flame className="size-4" />
                {recipe.nutrition.calories} cal/serving
              </span>
            )}
          </div>

          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Button
              onClick={handleToggleSave}
              disabled={saving || removing}
              variant="primary"
              size="lg"
            >
              {saving || removing ? (
                <>
                  <Loader2 className="size-4 animate-spin" />
                  {saving ? "Saving..." : "Removing..."}
                </>
              ) : isSaved ? (
                <>
                  <BookmarkCheck className="size-4" />
                  Saved to Collection
                </>
              ) : (
                <>
                  <Bookmark className="size-4" />
                  Save to Collection
                </>
              )}
            </Button>
            <PDFDownloadLink
              document={<RecipePDF recipe={recipe} />}
              fileName={`${recipe.title.replace(/\s+/g, "-").toLowerCase()}.pdf`}
            >
              {({ loading }) => (
                <Button variant="outline" size="lg" disabled={loading}>
                  <Download className="size-4" />
                  {loading ? "Preparing PDF..." : "Download PDF"}
                </Button>
              )}
            </PDFDownloadLink>
          </div>
        </div>
      </section>

      <section className="grid gap-6 lg:grid-cols-[0.82fr_1.18fr]">
        <div className="space-y-6">
          <div className="section-shell px-6 py-8 sm:px-8 lg:sticky lg:top-28">
            <h2 className="flex items-center gap-3 font-display text-5xl leading-none text-stone-950">
              <ChefHat className="size-7 text-emerald-900" />
              Ingredients
            </h2>

            <div className="mt-8 space-y-6">
              {Object.entries(
                recipe.ingredients.reduce((acc, ing) => {
                  const category = ing.category || "Other";
                  if (!acc[category]) acc[category] = [];
                  acc[category].push(ing);
                  return acc;
                }, {}),
              ).map(([category, items]) => (
                <div key={category}>
                  <p className="text-xs uppercase tracking-[0.22em] text-stone-500">
                    {category}
                  </p>
                  <ul className="mt-4 space-y-3">
                    {items.map((ingredient, index) => (
                      <li
                        key={`${ingredient.item}-${index}`}
                        className="flex items-start justify-between gap-3 rounded-[18px] border border-stone-900/8 bg-white/65 px-4 py-3"
                      >
                        <span className="text-stone-800">{ingredient.item}</span>
                        <span className="text-sm font-semibold text-emerald-900">
                          {ingredient.amount}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>

            {recipe.nutrition && (
              <div className="mt-8 rounded-[22px] border border-stone-900/8 bg-stone-950/[0.03] p-5">
                <p className="text-xs uppercase tracking-[0.22em] text-stone-500">
                  Nutrition per serving
                </p>
                <div className="mt-4 grid grid-cols-2 gap-3">
                  {[
                    ["Calories", recipe.nutrition.calories],
                    ["Protein", recipe.nutrition.protein],
                    ["Carbs", recipe.nutrition.carbs],
                    ["Fat", recipe.nutrition.fat],
                  ].map(([label, value]) => (
                    <div
                      key={label}
                      className="rounded-[18px] border border-stone-900/8 bg-white/70 p-4 text-center"
                    >
                      <p className="text-2xl font-semibold text-stone-950">{value}</p>
                      <p className="mt-1 text-xs uppercase tracking-[0.18em] text-stone-500">
                        {label}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="space-y-6">
          <div className="section-shell px-6 py-8 sm:px-8">
            <h2 className="font-display text-5xl leading-none text-stone-950">
              Step-by-step instructions
            </h2>

            <div className="mt-8 space-y-6">
              {recipe.instructions.map((step, index) => (
                <div key={step.step} className="relative pl-16">
                  <div className="absolute left-0 top-0 flex size-11 items-center justify-center rounded-full bg-stone-950 text-white shadow-[0_14px_26px_rgba(24,22,18,0.18)]">
                    {step.step}
                  </div>
                  {index !== recipe.instructions.length - 1 && (
                    <div className="absolute left-5 top-12 h-[calc(100%-1.5rem)] w-px bg-stone-300" />
                  )}
                  <div className="panel-surface p-5">
                    <h3 className="text-xl font-semibold text-stone-950">
                      {step.title}
                    </h3>
                    <p className="mt-3 text-base leading-7 text-stone-700">
                      {step.instruction}
                    </p>
                    {step.tip && (
                      <div className="mt-4 rounded-[18px] border border-amber-500/20 bg-amber-50/80 p-4">
                        <p className="flex items-start gap-2 text-sm leading-6 text-stone-800">
                          <Lightbulb className="mt-0.5 size-4 shrink-0 text-amber-600" />
                          <span>
                            <strong>Pro Tip:</strong> {step.tip}
                          </span>
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-8 rounded-[24px] border border-emerald-500/20 bg-[linear-gradient(135deg,rgba(28,80,66,0.08),rgba(213,144,50,0.14))] p-6">
              <div className="flex items-start gap-3">
                <CheckCircle2 className="mt-1 size-6 shrink-0 text-emerald-900" />
                <div>
                  <h3 className="text-lg font-semibold text-stone-950">
                    You&apos;re all set.
                  </h3>
                  <p className="mt-2 text-sm leading-6 text-stone-700">
                    Plate your {recipe.title} and enjoy the fact that tonight&apos;s
                    dinner came from ingredients you already had.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {recipe.tips && recipe.tips.length > 0 && (
            <div className="panel-dark px-6 py-8 sm:px-8">
              <h2 className="flex items-center gap-3 font-display text-5xl leading-none text-white">
                <Lightbulb className="size-7 text-amber-300" />
                Chef&apos;s tips
              </h2>
              <div className="mt-6 space-y-3">
                {recipe.tips.map((tip, index) => (
                  <div
                    key={`${tip}-${index}`}
                    className="rounded-[18px] border border-white/10 bg-white/6 px-4 py-4 text-sm leading-6 text-stone-200"
                  >
                    {tip}
                  </div>
                ))}
              </div>
            </div>
          )}

          {recipe.substitutions && recipe.substitutions.length > 0 && (
            <div className="section-shell px-6 py-8 sm:px-8">
              <h2 className="font-display text-5xl leading-none text-stone-950">
                Ingredient substitutions
              </h2>
              <p className="mt-4 text-sm leading-6 text-stone-600">
                Don&apos;t have everything? Here are strong alternatives you can use.
              </p>

              <div className="mt-6 space-y-4">
                {recipe.substitutions.map((sub, index) => (
                  <div
                    key={`${sub.original}-${index}`}
                    className="panel-surface p-5"
                  >
                    <p className="text-sm text-stone-600">
                      Instead of{" "}
                      <span className="font-semibold text-emerald-900">
                        {sub.original}
                      </span>
                    </p>
                    <div className="mt-4 flex flex-wrap gap-2">
                      {sub.alternatives.map((alt, altIndex) => (
                        <Badge
                          key={`${alt}-${altIndex}`}
                          variant="outline"
                          className="rounded-full bg-white/70"
                        >
                          {alt}
                        </Badge>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}

export default function RecipePage() {
  return (
    <Suspense
      fallback={
        <div className="page-frame">
          <div className="section-shell px-6 py-20 text-center sm:px-8">
            <Loader2 className="mx-auto size-14 animate-spin text-emerald-900" />
            <p className="mt-5 text-stone-600">Loading recipe...</p>
          </div>
        </div>
      }
    >
      <RecipeContent />
    </Suspense>
  );
}
