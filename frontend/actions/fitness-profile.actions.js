"use server";

import { backendFetch, checkUser } from "@/lib/checkUser";

/**
 * Get user's fitness profile
 */
export async function getFitnessProfile(user) {
  try {
    const authUser = await checkUser(user);
    if (!authUser) {
      return { success: false, error: "Not authenticated" };
    }

    const response = await backendFetch("/fitness-profile", authUser);

    if (!response) {
      return { success: false, error: "Not authenticated" };
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Error fetching fitness profile:", error);
    return { success: false, error: error.message };
  }
}

/**
 * Update user's fitness profile
 */
export async function updateFitnessProfile(user, profileData) {
  try {
    const authUser = await checkUser(user);
    if (!authUser) {
      return { success: false, error: "Not authenticated" };
    }

    const response = await backendFetch("/fitness-profile", authUser, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(profileData),
    });

    if (!response) {
      return { success: false, error: "Not authenticated" };
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Error updating fitness profile:", error);
    return { success: false, error: error.message };
  }
}

/**
 * Calculate macros
 */
export async function calculateMacros(user, userData) {
  try {
    const authUser = await checkUser(user);
    if (!authUser) {
      return { success: false, error: "Not authenticated" };
    }

    const response = await backendFetch("/fitness-profile/calculate-macros", authUser, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(userData),
    });

    if (!response) {
      return { success: false, error: "Not authenticated" };
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Error calculating macros:", error);
    return { success: false, error: error.message };
  }
}
