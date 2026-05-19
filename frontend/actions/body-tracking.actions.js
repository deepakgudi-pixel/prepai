"use server";

import { backendFetch, checkUser } from "@/lib/checkUser";

async function readJson(response) {
  if (!response) {
    return { success: false, error: "Not authenticated" };
  }

  return response.json();
}

/**
 * Get all body measurements
 */
export async function getBodyMeasurements(user, limit = 30) {
  try {
    const authUser = await checkUser(user);
    if (!authUser) {
      return { success: false, error: "Not authenticated" };
    }

    const response = await backendFetch(`/body-tracking?limit=${limit}`, authUser);
    return readJson(response);
  } catch (error) {
    console.error("Error fetching body measurements:", error);
    return { success: false, error: error.message };
  }
}

/**
 * Get latest body measurement
 */
export async function getLatestBodyMeasurement(user) {
  try {
    const authUser = await checkUser(user);
    if (!authUser) {
      return { success: false, error: "Not authenticated" };
    }

    const response = await backendFetch("/body-tracking/latest", authUser);
    return readJson(response);
  } catch (error) {
    console.error("Error fetching latest measurement:", error);
    return { success: false, error: error.message };
  }
}

/**
 * Get progress summary
 */
export async function getProgressSummary(user, weeks = 4) {
  try {
    const authUser = await checkUser(user);
    if (!authUser) {
      return { success: false, error: "Not authenticated" };
    }

    const response = await backendFetch(`/body-tracking/progress?weeks=${weeks}`, authUser);
    return readJson(response);
  } catch (error) {
    console.error("Error fetching progress summary:", error);
    return { success: false, error: error.message };
  }
}

/**
 * Add body measurement
 */
export async function addBodyMeasurement(user, measurementData) {
  try {
    const authUser = await checkUser(user);
    if (!authUser) {
      return { success: false, error: "Not authenticated" };
    }

    const response = await backendFetch("/body-tracking", authUser, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(measurementData),
    });

    return readJson(response);
  } catch (error) {
    console.error("Error adding body measurement:", error);
    return { success: false, error: error.message };
  }
}

/**
 * Update body measurement
 */
export async function updateBodyMeasurement(user, measurementId, measurementData) {
  try {
    const authUser = await checkUser(user);
    if (!authUser) {
      return { success: false, error: "Not authenticated" };
    }

    const response = await backendFetch(`/body-tracking/${measurementId}`, authUser, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(measurementData),
    });

    return readJson(response);
  } catch (error) {
    console.error("Error updating body measurement:", error);
    return { success: false, error: error.message };
  }
}

/**
 * Delete body measurement
 */
export async function deleteBodyMeasurement(user, measurementId) {
  try {
    const authUser = await checkUser(user);
    if (!authUser) {
      return { success: false, error: "Not authenticated" };
    }

    const response = await backendFetch(`/body-tracking/${measurementId}`, authUser, {
      method: "DELETE",
    });

    return readJson(response);
  } catch (error) {
    console.error("Error deleting body measurement:", error);
    return { success: false, error: error.message };
  }
}
