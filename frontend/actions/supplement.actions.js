"use server";

import { backendFetch, checkUser } from "@/lib/checkUser";

async function readJson(response) {
  if (!response) {
    return { success: false, error: "Not authenticated" };
  }

  return response.json();
}

/**
 * Get all supplements
 */
export async function getSupplements(user) {
  try {
    const authUser = await checkUser(user);
    if (!authUser) {
      return { success: false, error: "Not authenticated" };
    }

    const response = await backendFetch("/supplements", authUser);
    return readJson(response);
  } catch (error) {
    console.error("Error fetching supplements:", error);
    return { success: false, error: error.message };
  }
}

/**
 * Get supplement suggestions
 */
export async function getSupplementSuggestions(user) {
  try {
    const authUser = await checkUser(user);
    if (!authUser) {
      return { success: false, error: "Not authenticated" };
    }

    const response = await backendFetch("/supplements/suggestions", authUser);
    return readJson(response);
  } catch (error) {
    console.error("Error fetching supplement suggestions:", error);
    return { success: false, error: error.message };
  }
}

/**
 * Add supplement
 */
export async function addSupplement(user, supplementData) {
  try {
    const authUser = await checkUser(user);
    if (!authUser) {
      return { success: false, error: "Not authenticated" };
    }

    const response = await backendFetch("/supplements", authUser, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(supplementData),
    });

    return readJson(response);
  } catch (error) {
    console.error("Error adding supplement:", error);
    return { success: false, error: error.message };
  }
}

/**
 * Update supplement
 */
export async function updateSupplement(user, supplementId, supplementData) {
  try {
    const authUser = await checkUser(user);
    if (!authUser) {
      return { success: false, error: "Not authenticated" };
    }

    const response = await backendFetch(`/supplements/${supplementId}`, authUser, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(supplementData),
    });

    return readJson(response);
  } catch (error) {
    console.error("Error updating supplement:", error);
    return { success: false, error: error.message };
  }
}

/**
 * Delete supplement
 */
export async function deleteSupplement(user, supplementId) {
  try {
    const authUser = await checkUser(user);
    if (!authUser) {
      return { success: false, error: "Not authenticated" };
    }

    const response = await backendFetch(`/supplements/${supplementId}`, authUser, {
      method: "DELETE",
    });

    return readJson(response);
  } catch (error) {
    console.error("Error deleting supplement:", error);
    return { success: false, error: error.message };
  }
}

/**
 * Get supplement logs
 */
export async function getSupplementLogs(user, startDate, endDate, limit = 30) {
  try {
    const authUser = await checkUser(user);
    if (!authUser) {
      return { success: false, error: "Not authenticated" };
    }

    const params = new URLSearchParams({ limit: limit.toString() });
    if (startDate) params.append("startDate", startDate);
    if (endDate) params.append("endDate", endDate);

    const response = await backendFetch(`/supplements/logs?${params}`, authUser);
    return readJson(response);
  } catch (error) {
    console.error("Error fetching supplement logs:", error);
    return { success: false, error: error.message };
  }
}

/**
 * Get today's supplement logs
 */
export async function getTodaySupplementLogs(user) {
  try {
    const authUser = await checkUser(user);
    if (!authUser) {
      return { success: false, error: "Not authenticated" };
    }

    const response = await backendFetch("/supplements/logs/today", authUser);
    return readJson(response);
  } catch (error) {
    console.error("Error fetching today's supplement logs:", error);
    return { success: false, error: error.message };
  }
}

/**
 * Log supplement intake
 */
export async function logSupplement(user, supplementId, servings = 1, takenAt, notes) {
  try {
    const authUser = await checkUser(user);
    if (!authUser) {
      return { success: false, error: "Not authenticated" };
    }

    const response = await backendFetch(`/supplements/${supplementId}/log`, authUser, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ servings, takenAt, notes }),
    });

    return readJson(response);
  } catch (error) {
    console.error("Error logging supplement:", error);
    return { success: false, error: error.message };
  }
}
