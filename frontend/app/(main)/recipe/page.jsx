"use client";

import { useEffect, useMemo, useState, Suspense } from "react";
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
import { SignUpButton, useUser } from "@clerk/nextjs";
import {
  getOrGenerateRecipe,
  removeRecipeFromCollection,
  saveRecipeToCollection,
} from "@/actions/recipe.actions";
import { toast } from "sonner";
import { ClockLoader } from "react-spinners";
import { PDFDownloadLink } from "@react-pdf/renderer";
import { RecipePDF } from "@/components/extras/RecipePDF";
import Image from "next/image";
import { motion, useReducedMotion, useScroll, useTransform } from "framer-motion";

function RecipeContent() {
  const { user, isLoaded } = useUser();
  const searchParams = useSearchParams();
  const router = useRouter();
  const recipeName = searchParams.get("cook");

  const [savedOverride, setSavedOverride] = useState(null);
  const prefersReducedMotion = useReducedMotion();

  const {
    loading: loadingRecipe,
    data: recipeData,
    fn: fetchRecipe,
    setData: setRecipeData,
  } =
    useFetch(getOrGenerateRecipe);
  const { loading: saving, fn: saveToCollection } =
    useFetch(saveRecipeToCollection);
  const { loading: removing, fn: removeFromCollection } =
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
    if (!isLoaded || !recipeName || recipeData?.success) {
      return;
    }

    if (!authUser) {
      return;
    }

    let isCancelled = false;

    const loadRecipe = async () => {
      const formData = new FormData();
      formData.append("recipeName", recipeName);
      const result = await fetchRecipe(authUser, formData);

      if (!result?.success || isCancelled) {
        return;
      }

      if (result.fromDatabase) {
        toast.success("Recipe loaded from database");
      } else if (result.persisted === false) {
        toast.success("Recipe generated");
      } else {
        toast.success("New recipe generated and saved!");
      }
    };

    loadRecipe();

    return () => {
      isCancelled = true;
    };
  }, [authUser, fetchRecipe, isLoaded, recipeData?.success, recipeName]);

  const handleToggleSave = async () => {
    const recipeId = recipeData?.recipeId;
    const isSaved =
      savedOverride?.recipeName === recipeName
        ? savedOverride.value
        : Boolean(recipeData?.isSaved);

    const formData = new FormData();
    if (recipeId) {
      formData.append("recipeId", recipeId);
    } else if (recipe) {
      formData.append("recipe", JSON.stringify(recipe));
    } else {
      toast.error("Recipe details are still loading. Please try again.");
      return;
    }

    if (isSaved) {
      const result = await removeFromCollection(authUser, formData);

      if (result?.success) {
        setSavedOverride({ recipeName, value: false });
        toast.success("Recipe removed from collection");
      }

      return;
    }

    const result = await saveToCollection(authUser, formData);

    if (result?.success) {
      setSavedOverride({ recipeName, value: true });
      if (result.recipeId) {
        setRecipeData((currentData) => (
          currentData
            ? {
                ...currentData,
                recipeId: result.recipeId,
                isSaved: true,
                persisted: true,
                recipe: result.recipe || currentData.recipe,
              }
            : currentData
        ));
      }

      if (result.alreadySaved) {
        toast.info("Recipe is already in your collection");
      } else {
        toast.success("Recipe saved to your collection!");
      }
    }
  };

  const { scrollY } = useScroll();
  const y1 = useTransform(scrollY, [0, 1000], [0, 300]);
  const opacity1 = useTransform(scrollY, [0, 500], [1, 0]);
  const recipe = recipeData?.recipe ?? null;
  const effectiveSavedState =
    savedOverride?.recipeName === recipeName
      ? savedOverride.value
      : Boolean(recipeData?.isSaved);
  const loadError =
    !authUser && isLoaded && recipeName
      ? "Please sign up or sign in to generate and save recipes."
      : recipeData?.success === false
        ? (recipeData.message || "Failed to load recipe.")
        : "";
  const groupedIngredients = useMemo(() => {
    if (!recipe?.ingredients) {
      return [];
    }

    return Object.entries(
      recipe.ingredients.reduce((accumulator, ingredient) => {
        const category = ingredient.category || "Other";

        if (!accumulator[category]) {
          accumulator[category] = [];
        }

        accumulator[category].push(ingredient);
        return accumulator;
      }, {}),
    );
  }, [recipe]);

  if (!recipeName) {
    return (
      <div className="bg-[#EAE8E3] min-h-screen flex items-center justify-center pt-20">
        <div className="glass-card px-6 py-20 text-center max-w-2xl w-full mx-auto">
          <div className="mx-auto flex size-20 items-center justify-center rounded-full bg-[#111] text-[#EAE8E3]">
            <AlertCircle className="size-10" />
          </div>
          <h2 className="mt-8 font-display text-5xl leading-none text-[#111]">
            No recipe specified.
          </h2>
          <p className="mt-4 text-[#555]">Please select a recipe from the curated list.</p>
          <Link href="/curated" className="mt-8 inline-block glass-pill bg-[#222] text-[#EAE8E3] px-8 py-4 text-xs uppercase tracking-[0.2em] hover:bg-[#111] transition-colors">
            Go to Curated
          </Link>
        </div>
      </div>
    );
  }

  if ((loadingRecipe === null || loadingRecipe) && !loadError) {
    return (
      <div className="bg-[#EAE8E3] min-h-screen flex items-center justify-center pt-20">
        <div className="glass-card px-6 py-20 text-center max-w-2xl w-full mx-auto">
          <ClockLoader className="mx-auto" color="#222" />
          <h2 className="mt-8 font-display text-5xl leading-none text-[#111]">
            Preparing your recipe
          </h2>
          <p className="mt-4 text-[#555] font-light">
            Our AI chef is crafting detailed instructions for{" "}
            <span className="font-semibold text-[#111]">{recipeName}</span>.
          </p>
        </div>
      </div>
    );
  }

  if (loadingRecipe === false && !recipe) {
    return (
      <div className="bg-[#EAE8E3] min-h-screen flex items-center justify-center pt-20">
        <div className="glass-card px-6 py-20 text-center max-w-2xl w-full mx-auto">
          <div className="mx-auto flex size-20 items-center justify-center rounded-full bg-red-600 text-white">
            <AlertCircle className="size-10" />
          </div>
          <h2 className="mt-8 font-display text-5xl leading-none text-[#111]">
            Failed to load recipe.
          </h2>
          <p className="mt-4 text-[#555] font-light">
            {loadError || "Something went wrong while loading the recipe. Please try again."}
          </p>
          <div className="mt-12 flex flex-col justify-center gap-4 sm:flex-row">
            <button onClick={() => router.back()} className="glass-pill px-8 py-4 text-xs uppercase tracking-[0.2em] text-[#111] hover:bg-white/50 transition-colors flex items-center gap-2">
              <ArrowLeft className="size-4" /> Go Back
            </button>
            {!authUser && (
              <SignUpButton mode="modal">
                <button className="glass-pill bg-[#222] text-white px-8 py-4 text-xs uppercase tracking-[0.2em] hover:bg-[#111] transition-colors">
                  Sign up to continue
                </button>
              </SignUpButton>
            )}
            <button onClick={() => window.location.reload()} className="glass-pill bg-[#111] text-white px-8 py-4 text-xs uppercase tracking-[0.2em] hover:bg-black transition-colors">
              Retry
            </button>
          </div>
        </div>
      </div>
    );
  }

  const totalTime = parseInt(recipe.prepTime || 0, 10) + parseInt(recipe.cookTime || 0, 10);

  return (
    <div className="bg-[#EAE8E3] min-h-screen pb-32">
      {/* Editorial Parallax Hero */}
      <section className="relative h-[80vh] w-full overflow-hidden flex flex-col justify-end">
        {recipe.imageUrl ? (
          <motion.div
            style={{
              y: prefersReducedMotion ? 0 : y1,
              opacity: prefersReducedMotion ? 1 : opacity1,
            }}
            className="absolute inset-0 w-full h-full"
          >
            <Image
              src={recipe.imageUrl}
              alt={recipe.title}
              fill
              className="object-cover"
              sizes="100vw"
              priority
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
          </motion.div>
        ) : (
          <div className="absolute inset-0 bg-[#222]" />
        )}

        <div className="relative z-10 max-w-[1400px] w-full mx-auto px-6 sm:px-12 lg:px-20 pb-20">
          <button
            onClick={() => router.back()}
            className="glass-pill bg-white/10 border-white/20 text-[#EAE8E3] px-6 py-3 text-xs uppercase tracking-[0.2em] hover:bg-white/20 transition-colors inline-flex items-center gap-2 mb-8"
          >
            <ArrowLeft className="size-4" /> Back
          </button>

          <div className="flex flex-wrap gap-3 mb-6">
            <span className="glass-pill bg-black/40 border-white/20 text-[#EAE8E3] px-4 py-2 text-[0.65rem] uppercase tracking-[0.2em]">
              {recipe.cuisine}
            </span>
            <span className="glass-pill bg-black/40 border-white/20 text-[#EAE8E3] px-4 py-2 text-[0.65rem] uppercase tracking-[0.2em]">
              {recipe.category}
            </span>
          </div>

          <h1 className="font-display text-6xl sm:text-8xl lg:text-9xl text-[#EAE8E3] leading-[0.9] mb-8">
            {recipe.title}
          </h1>

          <div className="flex flex-col sm:flex-row gap-6 justify-between items-start sm:items-end border-t border-white/20 pt-8">
             <div className="flex flex-wrap gap-6 text-[#EAE8E3] font-light text-sm">
                <span className="flex items-center gap-2">
                  <Clock3 className="size-5" /> {totalTime} mins
                </span>
                <span className="flex items-center gap-2">
                  <Users className="size-5" /> {recipe.servings} portions
                </span>
                {recipe.nutrition?.calories && (
                  <span className="flex items-center gap-2">
                    <Flame className="size-5" /> {recipe.nutrition.calories} cal
                  </span>
                )}
             </div>
             
             <div className="flex gap-4">
                <PDFDownloadLink
                  document={<RecipePDF recipe={recipe} />}
                  fileName={`${recipe.title.replace(/\s+/g, "-").toLowerCase()}.pdf`}
                >
                  {({ loading }) => (
                    <button disabled={loading} className="glass-pill bg-white/10 border-white/20 text-[#EAE8E3] px-6 py-4 text-xs uppercase tracking-[0.2em] hover:bg-white/20 transition-colors inline-flex items-center gap-2">
                      <Download className="size-4" /> {loading ? "Preparing..." : "PDF"}
                    </button>
                  )}
                </PDFDownloadLink>
                <button
                  onClick={handleToggleSave}
                  disabled={saving || removing}
                  className="glass-pill bg-[#EAE8E3] text-[#111] px-6 py-4 text-xs uppercase tracking-[0.2em] hover:bg-white transition-colors inline-flex items-center gap-2"
                >
                  {saving || removing ? (
                    <Loader2 className="size-4 animate-spin" />
                  ) : effectiveSavedState ? (
                    <BookmarkCheck className="size-4" />
                  ) : (
                    <Bookmark className="size-4" />
                  )}
                  {effectiveSavedState ? "Saved" : "Save"}
                </button>
             </div>
          </div>
        </div>
      </section>

      {/* Description */}
      <section className="max-w-[1400px] w-full mx-auto px-6 sm:px-12 lg:px-20 py-24">
        <p className="font-display text-4xl leading-relaxed text-[#111] max-w-4xl mx-auto text-center">
          &ldquo;{recipe.description}&rdquo;
        </p>
      </section>

      {/* Main Content Grid */}
      <section className="max-w-[1400px] w-full mx-auto px-6 sm:px-12 lg:px-20 grid gap-12 lg:grid-cols-[0.8fr_1.2fr]">
        
        {/* Ingredients Column */}
        <div className="space-y-8">
          <div className="glass-card p-10 lg:sticky lg:top-32">
            <h2 className="flex items-center gap-4 font-display text-5xl leading-none text-[#111] border-b border-[#D5D3CE] pb-8 mb-8">
              <ChefHat className="size-8 text-[#555]" /> Ingredients
            </h2>

            <div className="space-y-10">
              {groupedIngredients.map(([category, items], idx) => (
                <motion.div 
                  key={category}
                  initial={prefersReducedMotion ? false : { opacity: 0, y: 20 }}
                  whileInView={prefersReducedMotion ? undefined : { opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={prefersReducedMotion ? { duration: 0 } : { delay: idx * 0.1 }}
                >
                  <p className="text-[0.65rem] uppercase tracking-[0.2em] text-[#777] mb-6">
                    {category}
                  </p>
                  <ul className="space-y-2">
                    {items.map((ingredient, index) => (
                      <li
                        key={`${ingredient.item}-${index}`}
                        className="flex items-end justify-between border-b border-dashed border-[#D5D3CE] pb-2"
                      >
                        <span className="text-lg text-[#111] font-light">{ingredient.item}</span>
                        <span className="text-sm font-medium text-[#555]">
                          {ingredient.amount}
                        </span>
                      </li>
                    ))}
                  </ul>
                </motion.div>
              ))}
            </div>

            {recipe.nutrition && (
              <div className="mt-16 border-t border-[#D5D3CE] pt-10">
                <p className="text-[0.65rem] uppercase tracking-[0.2em] text-[#777] mb-6">
                  Nutrition per serving
                </p>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  {[
                    ["Calories", recipe.nutrition.calories],
                    ["Protein", recipe.nutrition.protein],
                    ["Carbs", recipe.nutrition.carbs],
                    ["Fat", recipe.nutrition.fat],
                  ].map(([label, value]) => (
                    <div key={label} className="text-center">
                      <p className="font-display text-3xl text-[#111]">{value}</p>
                      <p className="text-[0.6rem] uppercase tracking-[0.2em] text-[#777] mt-2">
                        {label}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Instructions Column */}
        <div className="space-y-8">
          <div className="glass-card p-10 sm:p-16">
            <h2 className="font-display text-5xl leading-none text-[#111] border-b border-[#D5D3CE] pb-8 mb-12">
              Method
            </h2>

            <div className="space-y-16">
              {recipe.instructions.map((step) => (
                <motion.div 
                  key={step.step} 
                  className="relative pl-12 sm:pl-20"
                  initial={prefersReducedMotion ? false : { opacity: 0, x: 20 }}
                  whileInView={prefersReducedMotion ? undefined : { opacity: 1, x: 0 }}
                  viewport={{ once: true, margin: "-100px" }}
                  transition={prefersReducedMotion ? { duration: 0 } : { duration: 0.6 }}
                >
                  <div className="absolute left-0 top-0 font-display text-4xl sm:text-6xl text-[#D5D3CE]">
                    {step.step}
                  </div>
                  <div>
                    <h3 className="font-display text-3xl text-[#111] mb-4">
                      {step.title}
                    </h3>
                    <p className="text-lg text-[#555] font-light leading-relaxed">
                      {step.instruction}
                    </p>
                    {step.tip && (
                      <div className="mt-6 border-l-2 border-[#111] pl-6 py-2">
                        <p className="flex items-start gap-3 text-sm leading-relaxed text-[#111]">
                          <Lightbulb className="mt-1 size-4 shrink-0" />
                          <span>
                            <strong>Pro Tip:</strong> {step.tip}
                          </span>
                        </p>
                      </div>
                    )}
                  </div>
                </motion.div>
              ))}
            </div>

            <div className="mt-20 border-t border-[#D5D3CE] pt-12 flex items-start gap-6">
              <CheckCircle2 className="size-8 text-[#111] shrink-0" />
              <div>
                <h3 className="font-display text-3xl text-[#111] mb-2">
                  You&apos;re all set.
                </h3>
                <p className="text-[#555] font-light leading-relaxed">
                  Plate your {recipe.title} and enjoy the fact that tonight&apos;s
                  dinner came from ingredients you already had.
                </p>
              </div>
            </div>
          </div>

          {/* Tips & Substitutions */}
          <div className="grid sm:grid-cols-2 gap-8">
            {recipe.tips && recipe.tips.length > 0 && (
              <div className="glass-card bg-[#111] text-[#EAE8E3] p-10">
                <h2 className="flex items-center gap-3 font-display text-4xl mb-8">
                  <Lightbulb className="size-6 text-white" />
                  Chef&apos;s notes
                </h2>
                <div className="space-y-6">
                  {recipe.tips.map((tip, index) => (
                    <div key={index} className="text-sm font-light text-[#aaa] leading-relaxed border-b border-[#333] pb-4 last:border-0">
                      {tip}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {recipe.substitutions && recipe.substitutions.length > 0 && (
              <div className="glass-card p-10">
                <h2 className="font-display text-4xl text-[#111] mb-8">
                  Substitutions
                </h2>
                <div className="space-y-6">
                  {recipe.substitutions.map((sub, index) => (
                    <div key={index} className="border-b border-[#D5D3CE] pb-4 last:border-0">
                      <p className="text-[0.65rem] uppercase tracking-[0.2em] text-[#777] mb-2">
                        Instead of <span className="font-bold text-[#111]">{sub.original}</span>
                      </p>
                      <p className="text-[#555] font-light">
                        {sub.alternatives.join(", ")}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}

export default function RecipePage() {
  return (
    <Suspense
      fallback={
        <div className="bg-[#EAE8E3] min-h-screen flex items-center justify-center pt-20">
          <Loader2 className="size-10 animate-spin text-[#111]" />
        </div>
      }
    >
      <RecipeContent />
    </Suspense>
  );
}
