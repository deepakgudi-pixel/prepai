"use server";

const MEALDB_BASE = "https://www.themealdb.com/api/json/v1/1";

async function safeMealDbFetch(path, revalidate = 86400) {
  const response = await fetch(`${MEALDB_BASE}${path}`, {
    next: { revalidate },
    signal: AbortSignal.timeout(8000),
  });

  if (!response.ok) {
    throw new Error(`MealDB request failed with status ${response.status}`);
  }

  return response.json();
}

// Get random recipe of the day
export async function getRecipeOfTheDay() {
  try {
    const data = await safeMealDbFetch("/filter.php?c=Chicken");
    const meals = data.meals || [];

    if (!meals.length) {
      return { success: false, recipe: null };
    }

    const today = new Date();
    const dayIndex = Math.floor(today.getTime() / 86400000) % meals.length;
    const selectedMeal = meals[dayIndex];

    const detailData = await safeMealDbFetch(`/lookup.php?i=${selectedMeal.idMeal}`);

    return {
      success: true,
      recipe: detailData.meals[0],
    };
  } catch (error) {
    console.error("Error fetching recipe of the day:", error);
    return { success: false, recipe: null };
  }
}

// Get tomorrow's recipe (for homepage preview)
export async function getUpcomingRecipe() {
  try {
    const data = await safeMealDbFetch("/filter.php?c=Chicken");
    const meals = data.meals || [];

    if (!meals.length) {
      return { success: false, recipe: null };
    }

    const today = new Date();
    // +1 from recipe of the day
    const dayIndex =
      (Math.floor(today.getTime() / 86400000) + 1) % meals.length;
    const selectedMeal = meals[dayIndex];

    const detailData = await safeMealDbFetch(`/lookup.php?i=${selectedMeal.idMeal}`);
    return { success: true, recipe: detailData.meals[0] };
  } catch (error) {
    console.error("Error fetching upcoming recipe:", error);
    return { success: false, recipe: null };
  }
}

// Get all categories
export async function getCategories() {
  try {
    const data = await safeMealDbFetch("/list.php?c=list", 604800);

    return {
      success: true,
      categories: data.meals || [],
    };
  } catch (error) {
    console.error("Error fetching categories:", error);
    return {
      success: false,
      categories: [],
    };
  }
}

// Get all areas (cuisines)
export async function getAreas() {
  try {
    const data = await safeMealDbFetch("/list.php?a=list", 604800);
    return {
      success: true,
      areas: data.meals || [],
    };
  } catch (error) {
    console.error("Error fetching areas:", error);
    return {
      success: false,
      areas: [],
    };
  }
}

// Get meals by category
export async function getMealsByCategory(category) {
  try {
    const data = await safeMealDbFetch(`/filter.php?c=${category}`);
    const meals = data.meals || [];

    // Fetch full details for up to 20 meals
    const detailed = await Promise.all(
      meals.slice(0, 20).map((meal) =>
        safeMealDbFetch(`/lookup.php?i=${meal.idMeal}`)
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
    return {
      success: false,
      meals: [],
      category,
    };
  }
}

// Get meals by area
export async function getMealsByArea(area) {
  try {
    const data = await safeMealDbFetch(`/filter.php?a=${area}`);
    const meals = data.meals || [];

    // Fetch full details for up to 20 meals
    const detailed = await Promise.all(
      meals.slice(0, 20).map((meal) =>
        safeMealDbFetch(`/lookup.php?i=${meal.idMeal}`)
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
    return {
      success: false,
      meals: [],
      category: area,
    };
  }
}
