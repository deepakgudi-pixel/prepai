"use client";

import { useParams } from "next/navigation";

import { getMealsByCategory } from "@/actions/mealdb.actions";
import RecipeGrid from "@/components/extras/RecipeGrid";

export default function CategoryRecipesPage() {
  const params = useParams();
  const category = params.category;

  return (
    <RecipeGrid
      type={"category"}
      value={category}
      fetchAction={getMealsByCategory}
      backLink={"/dashboard"}
    />
  );
}
