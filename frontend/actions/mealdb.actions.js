"use server";

const MEALDB_BASE = "https://www.themealdb.com/api/json/v1/1";

const VEG_CATEGORIES = [
  "Vegetarian",
  "Vegan",
  "Pasta",
  "Dessert",
  "Starter",
  "Breakfast",
  "Side",
];

// Fetch all veg meal IDs across all veg-friendly categories
async function getVegMealIds() {
  const responses = await Promise.all(
    VEG_CATEGORIES.map((cat) =>
      fetch(`${MEALDB_BASE}/filter.php?c=${cat}`, {
        next: { revalidate: 86400 },
      })
        .then((r) => r.json())
        .then((d) => d.meals || [])
    )
  );

  const allIds = responses.flat().map((m) => m.idMeal);
  return new Set(allIds);
}

// Helper to filter only veg meals from a list
async function filterVegMeals(meals) {
  if (!meals) return [];

  const vegIds = await getVegMealIds();

  // Only keep meals that exist in any veg category
  const vegMeals = meals.filter((meal) => vegIds.has(meal.idMeal));

  // Fetch full details for those
  const detailed = await Promise.all(
    vegMeals.slice(0, 20).map((meal) =>
      fetch(`${MEALDB_BASE}/lookup.php?i=${meal.idMeal}`, {
        next: { revalidate: 86400 },
      })
        .then((r) => r.json())
        .then((d) => d.meals?.[0])
    )
  );

  return detailed.filter(Boolean);
}

// Get random recipe of the day (always vegetarian)
export async function getRecipeOfTheDay() {
  try {
    const response = await fetch(`${MEALDB_BASE}/filter.php?c=Vegetarian`, {
      next: { revalidate: 86400 },
    });

    if (!response.ok) throw new Error("Failed to fetch vegetarian meals");

    const data = await response.json();
    const meals = data.meals;

    const today = new Date();
    const dayIndex = Math.floor(today.getTime() / 86400000) % meals.length;
    const selectedMeal = meals[dayIndex];

    const detailResponse = await fetch(
      `${MEALDB_BASE}/lookup.php?i=${selectedMeal.idMeal}`,
      { next: { revalidate: 86400 } }
    );

    if (!detailResponse.ok) throw new Error("Failed to fetch meal details");

    const detailData = await detailResponse.json();

    return {
      success: true,
      recipe: detailData.meals[0],
    };
  } catch (error) {
    console.error("Error fetching recipe of the day:", error);
    throw new Error(error.message || "Failed to load recipe");
  }
}

// Get tomorrow's recipe (for homepage preview)
export async function getUpcomingRecipe() {
  try {
    const response = await fetch(`${MEALDB_BASE}/filter.php?c=Vegetarian`, {
      next: { revalidate: 86400 },
    });

    if (!response.ok) throw new Error("Failed to fetch vegetarian meals");

    const data = await response.json();
    const meals = data.meals;

    const today = new Date();
    // +1 from recipe of the day
    const dayIndex =
      (Math.floor(today.getTime() / 86400000) + 1) % meals.length;
    const selectedMeal = meals[dayIndex];

    const detailResponse = await fetch(
      `${MEALDB_BASE}/lookup.php?i=${selectedMeal.idMeal}`,
      { next: { revalidate: 86400 } }
    );

    const detailData = await detailResponse.json();
    return { success: true, recipe: detailData.meals[0] };
  } catch (error) {
    console.error("Error fetching upcoming recipe:", error);
    throw new Error(error.message || "Failed to load upcoming recipe");
  }
}

// Get only veg-friendly categories
export async function getCategories() {
  try {
    const response = await fetch(`${MEALDB_BASE}/list.php?c=list`, {
      next: { revalidate: 604800 },
    });

    if (!response.ok) throw new Error("Failed to fetch categories");

    const data = await response.json();
    const allCategories = data.meals || [];

    // Only show veg-friendly categories
    const vegCategories = allCategories.filter((cat) =>
      VEG_CATEGORIES.includes(cat.strCategory)
    );

    return {
      success: true,
      categories: vegCategories,
    };
  } catch (error) {
    console.error("Error fetching categories:", error);
    throw new Error(error.message || "Failed to load categories");
  }
}

// Get all areas (cuisines exist across veg/non-veg, keep as is)
export async function getAreas() {
  try {
    const response = await fetch(`${MEALDB_BASE}/list.php?a=list`, {
      next: { revalidate: 604800 },
    });

    if (!response.ok) throw new Error("Failed to fetch areas");

    const data = await response.json();
    return {
      success: true,
      areas: data.meals || [],
    };
  } catch (error) {
    console.error("Error fetching areas:", error);
    throw new Error(error.message || "Failed to load areas");
  }
}

// Get meals by category - filtered to veg only
export async function getMealsByCategory(category) {
  try {
    const response = await fetch(`${MEALDB_BASE}/filter.php?c=${category}`, {
      next: { revalidate: 86400 },
    });

    if (!response.ok) throw new Error("Failed to fetch meals");

    const data = await response.json();
    const meals = await filterVegMeals(data.meals);

    return {
      success: true,
      meals,
      category,
    };
  } catch (error) {
    console.error("Error fetching meals by category:", error);
    throw new Error(error.message || "Failed to load meals");
  }
}

// Get meals by area - filtered to veg only
export async function getMealsByArea(area) {
  try {
    const response = await fetch(`${MEALDB_BASE}/filter.php?a=${area}`, {
      next: { revalidate: 86400 },
    });

    if (!response.ok) throw new Error("Failed to fetch meals");

    const data = await response.json();
    const meals = await filterVegMeals(data.meals);

    return {
      success: true,
      meals,
      category: area,
    };
  } catch (error) {
    console.error("Error fetching meals by area:", error);
    throw new Error(error.message || "Failed to load meals");
  }
}