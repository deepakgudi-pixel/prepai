"use server";

import { backendFetch, checkUser } from "@/lib/checkUser";

/**
 * Get today's nutrition log
 */
export async function getTodayLog(user) {
  try {
    const authUser = await checkUser(user);
    if (!authUser) {
      return { success: false, error: "Not authenticated" };
    }

    const response = await backendFetch("/daily-nutrition/today", authUser);

    if (!response) {
      return { success: false, error: "Not authenticated" };
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Error fetching today's log:", error);
    return { success: false, error: error.message };
  }
}

/**
 * Get daily log by date
 */
export async function getDailyLog(user, date) {
  try {
    const authUser = await checkUser(user);
    if (!authUser) {
      return { success: false, error: "Not authenticated" };
    }

    const response = await backendFetch(`/daily-nutrition/date/${date}`, authUser);

    if (!response) {
      return { success: false, error: "Not authenticated" };
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Error fetching daily log:", error);
    return { success: false, error: error.message };
  }
}

/**
 * Get weekly logs
 */
export async function getWeeklyLogs(user, startDate) {
  try {
    const authUser = await checkUser(user);
    if (!authUser) {
      return { success: false, error: "Not authenticated" };
    }

    const params = startDate ? `?startDate=${startDate}` : "";
    const response = await backendFetch(`/daily-nutrition/weekly${params}`, authUser);

    if (!response) {
      return { success: false, error: "Not authenticated" };
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Error fetching weekly logs:", error);
    return { success: false, error: error.message };
  }
}

/**
 * Get weekly summary
 */
export async function getWeeklySummary(user) {
  try {
    const authUser = await checkUser(user);
    if (!authUser) {
      return { success: false, error: "Not authenticated" };
    }

    const response = await backendFetch("/daily-nutrition/weekly-summary", authUser);

    if (!response) {
      return { success: false, error: "Not authenticated" };
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Error fetching weekly summary:", error);
    return { success: false, error: error.message };
  }
}

/**
 * Get macro streaks
 */
export async function getMacroStreaks(user) {
  try {
    const authUser = await checkUser(user);
    if (!authUser) {
      return { success: false, error: "Not authenticated" };
    }

    const response = await backendFetch("/daily-nutrition/streaks", authUser);

    if (!response) {
      return { success: false, error: "Not authenticated" };
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Error fetching macro streaks:", error);
    return { success: false, error: error.message };
  }
}

/**
 * Get daily progress
 */
export async function getDailyProgress(user, date) {
  try {
    const authUser = await checkUser(user);
    if (!authUser) {
      return { success: false, error: "Not authenticated" };
    }

    const response = await backendFetch(`/daily-nutrition/progress/${date}`, authUser);

    if (!response) {
      return { success: false, error: "Not authenticated" };
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Error fetching daily progress:", error);
    return { success: false, error: error.message };
  }
}

/**
 * Add meal to daily log
 */
export async function addMealToLog(user, date, mealType, macros) {
  try {
    const authUser = await checkUser(user);
    if (!authUser) {
      return { success: false, error: "Not authenticated" };
    }

    const response = await backendFetch("/daily-nutrition/add-meal", authUser, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ date, mealType, macros }),
    });

    if (!response) {
      return { success: false, error: "Not authenticated" };
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Error adding meal to log:", error);
    return { success: false, error: error.message };
  }
}

/**
 * Set daily log totals
 */
export async function setDailyLogTotals(user, date, totals) {
  try {
    const authUser = await checkUser(user);
    if (!authUser) {
      return { success: false, error: "Not authenticated" };
    }

    const response = await backendFetch("/daily-nutrition/totals", authUser, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ date, totals }),
    });

    if (!response) {
      return { success: false, error: "Not authenticated" };
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Error setting daily totals:", error);
    return { success: false, error: error.message };
  }
}

/**
 * Mark day as workout day
 */
export async function markAsWorkoutDay(user, date, isWorkoutDay = true) {
  try {
    const authUser = await checkUser(user);
    if (!authUser) {
      return { success: false, error: "Not authenticated" };
    }

    const response = await backendFetch("/daily-nutrition/workout-day", authUser, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ date, isWorkoutDay }),
    });

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
