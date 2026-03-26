import { currentUser } from "@clerk/nextjs/server";

const STRAPI_URL =
  process.env.NEXT_PUBLIC_STRAPI_URL || "http://localhost:1337";
const STRAPI_API_TOKEN = process.env.STRAPI_API_TOKEN;

// Permanent fix: Helper to handle transient Strapi Cloud 5xx errors with retries
const fetchWithRetry = async (url, options, retries = 5, delay = 1000) => {
  let lastResponse;
  for (let i = 0; i < retries; i++) {
    try {
      // Add a signal timeout to prevent hanging requests
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 10000);
      
      lastResponse = await fetch(url, { ...options, signal: controller.signal });
      clearTimeout(timeout);

      // Return immediately if successful or if it's a client-side error (4xx) which shouldn't be retried
      if (lastResponse.ok || (lastResponse.status >= 400 && lastResponse.status < 500)) {
        return lastResponse;
      }
      console.warn(`⚠️ Strapi attempt ${i + 1}/${retries} failed (Status: ${lastResponse.status}). Retrying in ${delay * Math.pow(2, i)}ms...`);
    } catch (error) {
      console.warn(`⚠️ Strapi network error on attempt ${i + 1}: ${error.message}. Retrying...`);
    }
    // Exponential backoff: 1s, 2s, 4s, 8s...
    if (i < retries - 1) await new Promise((res) => setTimeout(res, delay * Math.pow(2, i)));
  }
  return lastResponse;
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
    // Check if user exists in Strapi
    const existingUserResponse = await fetchWithRetry(
      `${STRAPI_URL}/api/users?filters[clerkId][$eq]=${user.id}`,
      {
        headers: {
          Authorization: `Bearer ${STRAPI_API_TOKEN}`,
        },
        cache: "no-store",
      }
    );

    if (existingUserResponse && existingUserResponse.ok) {
      const contentType = existingUserResponse.headers.get("content-type");
      if (contentType && contentType.includes("application/json")) {
        const existingUserData = await existingUserResponse.json();
        if (existingUserData && Array.isArray(existingUserData) && existingUserData.length > 0) {
          return existingUserData[0];
        }
      }
    } else {
      const errorText = await existingUserResponse.text().catch(() => "Unable to read error body");
      const status = existingUserResponse?.status || "Network Error";
      console.error(`❌ Strapi user lookup failed permanently after retries [${status}]:`, errorText);

      // Throw specific error because Clerk user exists, but backend is down.
      // This differentiates from a missing user (null).
      throw new Error(`Pantry service is temporarily unavailable (${status}). Please try again in a moment.`);
    }

    // Get authenticated role
    const rolesResponse = await fetchWithRetry(
      `${STRAPI_URL}/api/users-permissions/roles`,
      {
        headers: {
          Authorization: `Bearer ${STRAPI_API_TOKEN}`,
        },
        cache: "no-store",
      }
    );

    if (!rolesResponse.ok) {
      console.error(`❌ Failed to fetch roles permanently [${rolesResponse?.status}]`);
      throw new Error("Pantry service configuration error. Please contact support.");
    }

    const rolesData = await rolesResponse.json();
    if (!rolesData?.roles) {
      throw new Error("Invalid roles response from backend");
    }

    const authenticatedRole = rolesData.roles.find(
      (role) => role.type === "authenticated"
    );

    if (!authenticatedRole) {
      console.error("❌ Authenticated role not found");
      throw new Error("User permissions could not be established.");
    }

    // Create new user
    const userData = {
      username:
        user.username ||
        user.emailAddresses[0].emailAddress.split("@")[0],
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

    if (!newUserResponse.ok) {
      const errorText = await newUserResponse.text();
      console.error("❌ Error creating user:", errorText);
      throw new Error("Failed to sync your profile with the pantry service.");
    }

    const newUser = await newUserResponse.json();
    return newUser;
  } catch (error) {
    console.error("❌ Critical error in checkUser:", error.message);
    throw error; // Re-throw so actions can handle it
  }
};