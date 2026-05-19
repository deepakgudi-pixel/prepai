"use server";

import { backendFetch, checkUser } from "@/lib/checkUser";

export async function getOrGenerateRecipe(user, formData) {
  try {
    const authUser = await checkUser(user);
    if (!authUser) {
      return { success: false, message: "User not authenticated" };
    }

    const recipeName = formData.get("recipeName");
    if (!recipeName) {
      throw new Error("Recipe name is required");
    }

    const response = await backendFetch("/recipes/generate", authUser, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ recipeName }),
    });

    if (!response) {
      return { success: false, message: "User not authenticated" };
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Error in getOrGenerateRecipe:", error);
    return { success: false, message: error.message || "Failed to load recipe" };
  }
}

export async function saveRecipeToCollection(user, formData) {
  try {
    const authUser = await checkUser(user);
    if (!authUser) {
      throw new Error("User not authenticated");
    }

    const recipeId = formData.get("recipeId");
    const rawRecipe = formData.get("recipe");

    const response = recipeId
      ? await backendFetch(`/recipes/${recipeId}/save`, authUser, {
          method: "POST",
        })
      : await backendFetch("/recipes/save-generated", authUser, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ recipe: rawRecipe ? JSON.parse(rawRecipe) : null }),
        });

    if (!response) {
      throw new Error("User not authenticated");
    }

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || "Failed to save recipe");
    }

    return data;
  } catch (error) {
    console.error("Error saving recipe:", error);
    return { success: false, message: error.message || "Failed to save recipe" };
  }
}

export async function removeRecipeFromCollection(user, formData) {
  try {
    const authUser = await checkUser(user);
    if (!authUser) {
      throw new Error("User not authenticated");
    }

    const recipeId = formData.get("recipeId");
    if (!recipeId) {
      throw new Error("Recipe ID is required");
    }

    const response = await backendFetch(`/recipes/${recipeId}/save`, authUser, {
      method: "DELETE",
    });

    if (!response) {
      throw new Error("User not authenticated");
    }

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || "Failed to remove recipe");
    }

    return data;
  } catch (error) {
    console.error("Error removing recipe:", error);
    return { success: false, message: error.message || "Failed to remove recipe" };
  }
}

export async function getRecipesByPantryIngredients(user, diet = "all") {
  try {
    const authUser = await checkUser(user);
    if (!authUser) {
      return { success: false, recipes: [], message: "User not authenticated" };
    }

    const response = await backendFetch("/recipes/suggestions", authUser, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ diet }),
    });

    if (!response) {
      return { success: false, recipes: [], message: "User not authenticated" };
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Error fetching recipe suggestions:", error);
    return {
      success: false,
      recipes: [],
      message: error.message || "Failed to fetch recipe suggestions",
    };
  }
}

export async function getSavedRecipes(user) {
  try {
    const authUser = await checkUser(user);
    if (!authUser) {
      return { success: false, recipes: [], message: "User not authenticated" };
    }

    const response = await backendFetch("/recipes/saved", authUser);

    if (!response) {
      return { success: false, recipes: [], message: "User not authenticated" };
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Error fetching saved recipes:", error);
    return {
      success: false,
      recipes: [],
      message: error.message || "Failed to fetch saved recipes",
    };
  }
}

export async function updateUserPreference(user, preference) {
  try {
    const authUser = await checkUser(user);
    if (!authUser) {
      throw new Error("User not authenticated");
    }

    const response = await backendFetch("/users/preference", authUser, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ preference }),
    });

    if (!response) {
      throw new Error("User not authenticated");
    }

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || "Failed to update preference");
    }

    return data;
  } catch (error) {
    console.error("Error updating dietary preference:", error);
    return { success: false, message: error.message || "Failed to update preference" };
  }
}

export async function getUserPreference(user) {
  try {
    const authUser = await checkUser(user);
    if (!authUser) {
      return { success: false, preference: "all" };
    }

    const response = await backendFetch("/users/preference", authUser);

    if (!response) {
      return { success: false, preference: "all" };
    }

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || "Failed to fetch preference");
    }

    return data;
  } catch (error) {
    console.error("Error fetching dietary preference:", error);
    return { success: false, preference: "all" };
  }
}

export async function getSuggestedRecipes(user, date) {
  try {
    const authUser = await checkUser(user);
    if (!authUser) {
      return { success: false, recipes: [], message: "User not authenticated" };
    }

    const response = await backendFetch("/recipes/suggest-for-macros", authUser, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ date }),
    });

    if (!response) {
      return { success: false, recipes: [], message: "User not authenticated" };
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Error fetching suggested recipes:", error);
    return {
      success: false,
      recipes: [],
      message: error.message || "Failed to fetch suggested recipes",
    };
  }
}
