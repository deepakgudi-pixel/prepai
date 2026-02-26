"use server";

const MEALDB_BASE = "https://www.themealdb.com/api/json/v1/1";

// Get random recipe of the day
export async function getRecipeOfTheDay() {
  try {
    const response = await fetch(`${MEALDB_BASE}/filter.php?c=Chicken`, {
      next: { revalidate: 86400 },
    });

    if (!response.ok) throw new Error("Failed to fetch meals");

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
    const response = await fetch(`${MEALDB_BASE}/filter.php?c=Chicken`, {
      next: { revalidate: 86400 },
    });

    if (!response.ok) throw new Error("Failed to fetch meals");

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

// Get all categories
export async function getCategories() {
  try {
    const response = await fetch(`${MEALDB_BASE}/list.php?c=list`, {
      next: { revalidate: 604800 },
    });

    if (!response.ok) throw new Error("Failed to fetch categories");

    const data = await response.json();

    return {
      success: true,
      categories: data.meals || [],
    };
  } catch (error) {
    console.error("Error fetching categories:", error);
    throw new Error(error.message || "Failed to load categories");
  }
}

// Get all areas (cuisines)
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

// Get meals by category
export async function getMealsByCategory(category) {
  try {
    const response = await fetch(`${MEALDB_BASE}/filter.php?c=${category}`, {
      next: { revalidate: 86400 },
    });

    if (!response.ok) throw new Error("Failed to fetch meals");

    const data = await response.json();
    const meals = data.meals || [];

    // Fetch full details for up to 20 meals
    const detailed = await Promise.all(
      meals.slice(0, 20).map((meal) =>
        fetch(`${MEALDB_BASE}/lookup.php?i=${meal.idMeal}`, {
          next: { revalidate: 86400 },
        })
          .then((r) => r.json())
          .then((d) => d.meals?.[0])
      )
    );

    return {
      success: true,
      meals: detailed.filter(Boolean),
      category,
    };
  } catch (error) {
    console.error("Error fetching meals by category:", error);
    throw new Error(error.message || "Failed to load meals");
  }
}

// Get meals by area
export async function getMealsByArea(area) {
  try {
    const response = await fetch(`${MEALDB_BASE}/filter.php?a=${area}`, {
      next: { revalidate: 86400 },
    });

    if (!response.ok) throw new Error("Failed to fetch meals");

    const data = await response.json();
    const meals = data.meals || [];

    // Fetch full details for up to 20 meals
    const detailed = await Promise.all(
      meals.slice(0, 20).map((meal) =>
        fetch(`${MEALDB_BASE}/lookup.php?i=${meal.idMeal}`, {
          next: { revalidate: 86400 },
        })
          .then((r) => r.json())
          .then((d) => d.meals?.[0])
      )
    );

    return {
      success: true,
      meals: detailed.filter(Boolean),
      category: area,
    };
  } catch (error) {
    console.error("Error fetching meals by area:", error);
    throw new Error(error.message || "Failed to load meals");
  }
}