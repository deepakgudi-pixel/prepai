"use client";

import { useParams } from "next/navigation";

import { getMealsByArea } from "@/actions/mealdb.actions";
import RecipeGrid from "@/components/extras/RecipeGrid";

export default function CuisineRecipesPage() {
  const params = useParams();
  const cuisine = params.cuisine;

  return (
    <RecipeGrid
      type={"cuisine"}
      value={cuisine}
      fetchAction={getMealsByArea}
      backLink={"/dashboard"}
    />
  );
}
