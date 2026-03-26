import { currentUser } from "@clerk/nextjs/server";

const STRAPI_URL =
  process.env.NEXT_PUBLIC_STRAPI_URL || "http://localhost:1337";
const STRAPI_API_TOKEN = process.env.STRAPI_API_TOKEN;

/**
 * Retries a fetch request with exponential backoff.
 * Key fix: retries=8 and longer timeout (20s) to survive Strapi Cloud cold starts.
 * Strapi Cloud can take 10-30s to wake from idle — we wait it out instead of failing fast.
 */
const fetchWithRetry = async (url, options, retries = 8, delay = 1500) => {
  let lastResponse;
  let lastError;

  for (let i = 0; i < retries; i++) {
    try {
      const controller = new AbortController();
      // Increased to 25s — Strapi Cloud cold starts can take 15-25s
      const timeout = setTimeout(() => controller.abort(), 25000);

      lastResponse = await fetch(url, { ...options, signal: controller.signal });
      clearTimeout(timeout);

      // Success or a real client error (4xx) — no point retrying
      if (lastResponse.ok || (lastResponse.status >= 400 && lastResponse.status < 500)) {
        return lastResponse;
      }

      // 5xx = Strapi is waking up or overloaded — keep retrying
      console.warn(
        `⚠️ Strapi attempt ${i + 1}/${retries} failed (Status: ${lastResponse.status}). ` +
        `Retrying in ${Math.round((delay * Math.pow(2, i)) / 1000)}s...`
      );
    } catch (error) {
      lastError = error;
      const isTimeout = error.name === "AbortError";
      console.warn(
        `⚠️ Strapi ${isTimeout ? "timeout" : "network error"} on attempt ${i + 1}/${retries}: ` +
        `${error.message}. Retrying...`
      );
    }

    // Exponential backoff: 1.5s → 3s → 6s → 12s → 24s ...
    // This gives Strapi Cloud enough time to fully wake up between attempts
    if (i < retries - 1) {
      await new Promise((res) => setTimeout(res, delay * Math.pow(2, i)));
    }
  }

  return lastResponse; // Return last response (even if 5xx) so caller can inspect status
};

/**
 * Warms up Strapi by hitting a lightweight endpoint before the real requests.
 * This avoids the first real user-facing request bearing the full cold-start delay.
 */
const warmUpStrapi = async () => {
  try {
    await fetchWithRetry(
      `${STRAPI_URL}/_health`,
      {
        headers: { Authorization: `Bearer ${STRAPI_API_TOKEN}` },
        cache: "no-store",
      },
      3,   // fewer retries for the warm-up ping
      2000
    );
  } catch {
    // Ignore warm-up errors — it's best-effort
  }
};

export const checkUser = async () => {
  const user = await currentUser();

  if (!user) {
    return null;
  }

  if (!STRAPI_API_TOKEN || !STRAPI_URL) {
    console.error("❌ Strapi configuration missing");
    throw new Error("Backend service configuration missing");
  }

  try {
    // 🔥 Warm up Strapi first if it's been idle.
    // This absorbs the cold-start latency before real queries run.
    await warmUpStrapi();

    // Check if user already exists in Strapi
    const existingUserResponse = await fetchWithRetry(
      `${STRAPI_URL}/api/users?filters[clerkId][$eq]=${user.id}`,
      {
        headers: {
          Authorization: `Bearer ${STRAPI_API_TOKEN}`,
        },
        cache: "no-store",
      }
    );

    if (!existingUserResponse) {
      throw new Error("Pantry service is temporarily unavailable. Please try again in a moment.");
    }

    if (existingUserResponse.ok) {
      const contentType = existingUserResponse.headers.get("content-type");
      if (contentType && contentType.includes("application/json")) {
        const existingUserData = await existingUserResponse.json();
        if (Array.isArray(existingUserData) && existingUserData.length > 0) {
          return existingUserData[0];
        }
      }
    } else {
      const errorText = await existingUserResponse.text().catch(() => "Unable to read error body");
      const status = existingUserResponse?.status ?? "Unknown";
      console.error(`❌ Strapi user lookup failed after all retries [${status}]:`, errorText);
      throw new Error(
        `Pantry service is temporarily unavailable (${status}). Please try again in a moment.`
      );
    }

    // Fetch the authenticated role
    const rolesResponse = await fetchWithRetry(
      `${STRAPI_URL}/api/users-permissions/roles`,
      {
        headers: {
          Authorization: `Bearer ${STRAPI_API_TOKEN}`,
        },
        cache: "no-store",
      }
    );

    if (!rolesResponse || !rolesResponse.ok) {
      const status = rolesResponse?.status ?? "Unknown";
      console.error(`❌ Failed to fetch roles [${status}]`);
      throw new Error("Pantry service configuration error. Please contact support.");
    }

    const rolesData = await rolesResponse.json();
    if (!rolesData?.roles) {
      throw new Error("Invalid roles response from backend");
    }

    const authenticatedRole = rolesData.roles.find((role) => role.type === "authenticated");
    if (!authenticatedRole) {
      console.error("❌ Authenticated role not found");
      throw new Error("User permissions could not be established.");
    }

    // Create new user in Strapi
    const userData = {
      username:
        user.username || user.emailAddresses[0].emailAddress.split("@")[0],
      email: user.emailAddresses[0].emailAddress,
      password: `clerk_managed_${user.id}_${Date.now()}`,
      confirmed: true,
      blocked: false,
      role: authenticatedRole.id,
      clerkId: user.id,
      firstName: user.firstName || "",
      lastName: user.lastName || "",
      imageUrl: user.imageUrl || "",
      dietaryPreference: "all",
    };

    const newUserResponse = await fetchWithRetry(`${STRAPI_URL}/api/users`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${STRAPI_API_TOKEN}`,
      },
      body: JSON.stringify(userData),
    });

    if (!newUserResponse || !newUserResponse.ok) {
      const errorText = await newUserResponse?.text().catch(() => "");
      console.error("❌ Error creating user:", errorText);
      throw new Error("Failed to sync your profile with the pantry service.");
    }

    const newUser = await newUserResponse.json();
    return newUser;
  } catch (error) {
    console.error("❌ Critical error in checkUser:", error.message);
    throw error;
  }
};