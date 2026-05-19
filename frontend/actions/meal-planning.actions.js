"use server";

import { backendFetch, checkUser } from "@/lib/checkUser";

/**
 * Get all meal plans
 */
export async function getMealPlans(user, includeInactive = false) {
  try {
    const authUser = await checkUser(user);
    if (!authUser) {
      return { success: false, error: "Not authenticated" };
    }

    const params = includeInactive ? "?includeInactive=true" : "";
    const response = await backendFetch(`/meal-plans${params}`, authUser);

    if (!response) {
      return { success: false, error: "Not authenticated" };
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Error fetching meal plans:", error);
    return { success: false, error: error.message };
  }
}

/**
 * Get active meal plan
 */
export async function getActiveMealPlan(user) {
  try {
    const authUser = await checkUser(user);
    if (!authUser) {
      return { success: false, error: "Not authenticated" };
    }

    const response = await backendFetch("/meal-plans/active", authUser);

    if (!response) {
      return { success: false, error: "Not authenticated" };
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Error fetching active meal plan:", error);
    return { success: false, error: error.message };
  }
}

/**
 * Get meal plan by ID
 */
export async function getMealPlanById(user, mealPlanId) {
  try {
    const authUser = await checkUser(user);
    if (!authUser) {
      return { success: false, error: "Not authenticated" };
    }

    const response = await backendFetch(`/meal-plans/${mealPlanId}`, authUser);

    if (!response) {
      return { success: false, error: "Not authenticated" };
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Error fetching meal plan:", error);
    return { success: false, error: error.message };
  }
}

/**
 * Get meal plan days
 */
export async function getMealPlanDays(user, mealPlanId) {
  try {
    const authUser = await checkUser(user);
    if (!authUser) {
      return { success: false, error: "Not authenticated" };
    }

    const response = await backendFetch(`/meal-plans/${mealPlanId}/days`, authUser);

    if (!response) {
      return { success: false, error: "Not authenticated" };
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Error fetching meal plan days:", error);
    return { success: false, error: error.message };
  }
}

/**
 * Get meal plan day by date
 */
export async function getMealPlanDayByDate(user, mealPlanId, date) {
  try {
    const authUser = await checkUser(user);
    if (!authUser) {
      return { success: false, error: "Not authenticated" };
    }

    const response = await backendFetch(`/meal-plans/${mealPlanId}/days/${date}`, authUser);

    if (!response) {
      return { success: false, error: "Not authenticated" };
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Error fetching meal plan day:", error);
    return { success: false, error: error.message };
  }
}

/**
 * Create meal plan
 */
export async function createMealPlan(user, planData) {
  try {
    const authUser = await checkUser(user);
    if (!authUser) {
      return { success: false, error: "Not authenticated" };
    }

    const response = await backendFetch("/meal-plans", authUser, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(planData),
    });

    if (!response) {
      return { success: false, error: "Not authenticated" };
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Error creating meal plan:", error);
    return { success: false, error: error.message };
  }
}

/**
 * Generate weekly meal plan
 */
export async function generateWeeklyPlan(user, preferences = {}) {
  try {
    const authUser = await checkUser(user);
    if (!authUser) {
      return { success: false, error: "Not authenticated" };
    }

    const response = await backendFetch("/meal-plans/generate", authUser, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(preferences),
    });

    if (!response) {
      return { success: false, error: "Not authenticated" };
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Error generating weekly plan:", error);
    return { success: false, error: error.message };
  }
}

/**
 * Copy meal plan
 */
export async function copyMealPlan(user, mealPlanId, newName) {
  try {
    const authUser = await checkUser(user);
    if (!authUser) {
      return { success: false, error: "Not authenticated" };
    }

    const response = await backendFetch(`/meal-plans/${mealPlanId}/copy`, authUser, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ newName }),
    });

    if (!response) {
      return { success: false, error: "Not authenticated" };
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Error copying meal plan:", error);
    return { success: false, error: error.message };
  }
}

/**
 * Optimize meal plan
 */
export async function optimizeMealPlan(user, mealPlanId) {
  try {
    const authUser = await checkUser(user);
    if (!authUser) {
      return { success: false, error: "Not authenticated" };
    }

    const response = await backendFetch(`/meal-plans/${mealPlanId}/optimize`, authUser, {
      method: "POST",
    });

    if (!response) {
      return { success: false, error: "Not authenticated" };
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Error optimizing meal plan:", error);
    return { success: false, error: error.message };
  }
}

/**
 * Update meal plan
 */
export async function updateMealPlan(user, mealPlanId, planData) {
  try {
    const authUser = await checkUser(user);
    if (!authUser) {
      return { success: false, error: "Not authenticated" };
    }

    const response = await backendFetch(`/meal-plans/${mealPlanId}`, authUser, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(planData),
    });

    if (!response) {
      return { success: false, error: "Not authenticated" };
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Error updating meal plan:", error);
    return { success: false, error: error.message };
  }
}

/**
 * Delete meal plan
 */
export async function deleteMealPlan(user, mealPlanId) {
  try {
    const authUser = await checkUser(user);
    if (!authUser) {
      return { success: false, error: "Not authenticated" };
    }

    const response = await backendFetch(`/meal-plans/${mealPlanId}`, authUser, {
      method: "DELETE",
    });

    if (!response) {
      return { success: false, error: "Not authenticated" };
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Error deleting meal plan:", error);
    return { success: false, error: error.message };
  }
}

/**
 * Add meal to plan day
 */
export async function addMealToPlan(user, mealPlanId, dayNumber, date, mealType, mealData) {
  try {
    const authUser = await checkUser(user);
    if (!authUser) {
      return { success: false, error: "Not authenticated" };
    }

    const response = await backendFetch(`/meal-plans/${mealPlanId}/days/${dayNumber}/meals`, authUser, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ date, mealType, mealData }),
    });

    if (!response) {
      return { success: false, error: "Not authenticated" };
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Error adding meal to plan:", error);
    return { success: false, error: error.message };
  }
}

/**
 * Remove meal from plan day
 */
export async function removeMealFromPlan(user, mealPlanId, dayNumber, mealType) {
  try {
    const authUser = await checkUser(user);
    if (!authUser) {
      return { success: false, error: "Not authenticated" };
    }

    const response = await backendFetch(
      `/meal-plans/${mealPlanId}/days/${dayNumber}/meals/${mealType}`,
      authUser,
      {
        method: "DELETE",
      }
    );

    if (!response) {
      return { success: false, error: "Not authenticated" };
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Error removing meal from plan:", error);
    return { success: false, error: error.message };
  }
}

/**
 * Mark day as workout day
 */
export async function markDayAsWorkout(user, mealPlanId, dayNumber, isWorkoutDay = true) {
  try {
    const authUser = await checkUser(user);
    if (!authUser) {
      return { success: false, error: "Not authenticated" };
    }

    const response = await backendFetch(
      `/meal-plans/${mealPlanId}/days/${dayNumber}/workout`,
      authUser,
      {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ isWorkoutDay }),
      }
    );

    if (!response) {
      return { success: false, error: "Not authenticated" };
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Error marking workout day:", error);
    return { success: false, error: error.message };
  }
}

/**
 * Get saved grocery list from meal plan
 */
export async function getGroceryList(user, mealPlanId) {
  try {
    const authUser = await checkUser(user);
    if (!authUser) {
      return { success: false, error: "Not authenticated" };
    }

    const response = await backendFetch(`/meal-plans/${mealPlanId}/grocery-list`, authUser);

    if (!response) {
      return { success: false, error: "Not authenticated" };
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Error fetching grocery list:", error);
    return { success: false, error: error.message };
  }
}

/**
 * Generate grocery list from meal plan
 */
export async function generateGroceryList(user, mealPlanId, options = {}) {
  try {
    const authUser = await checkUser(user);
    if (!authUser) {
      return { success: false, error: "Not authenticated" };
    }

    const response = await backendFetch(`/meal-plans/${mealPlanId}/grocery-list`, authUser, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ force: options.force === true }),
    });

    if (!response) {
      return { success: false, error: "Not authenticated" };
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Error generating grocery list:", error);
    return { success: false, error: error.message };
  }
}
