import { currentUser } from "@clerk/nextjs/server";

const STRAPI_URL =
  process.env.NEXT_PUBLIC_STRAPI_URL || "http://localhost:1337";
const STRAPI_API_TOKEN = process.env.STRAPI_API_TOKEN;
const USER_CACHE_TTL_MS = 5 * 60 * 1000;

const userCache = new Map();
let authenticatedRoleCache = null;

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const fetchWithRetry = async (url, options, retries = 2, delay = 350) => {
  let lastResponse;
  let lastError;

  for (let attempt = 0; attempt <= retries; attempt += 1) {
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 4500);

      lastResponse = await fetch(url, {
        ...options,
        signal: controller.signal,
      });
      clearTimeout(timeout);

      if (lastResponse.ok || (lastResponse.status >= 400 && lastResponse.status < 500)) {
        return lastResponse;
      }
    } catch (error) {
      lastError = error;
    }

    if (attempt < retries) {
      await sleep(delay * (attempt + 1));
    }
  }

  if (lastError) {
    throw lastError;
  }

  return lastResponse;
};

const getCachedUser = (clerkId) => {
  const entry = userCache.get(clerkId);

  if (!entry) return null;
  if (Date.now() > entry.expiresAt) {
    userCache.delete(clerkId);
    return null;
  }

  return entry.user;
};

const setCachedUser = (clerkId, user) => {
  userCache.set(clerkId, {
    user,
    expiresAt: Date.now() + USER_CACHE_TTL_MS,
  });
};

const getAuthenticatedRoleId = async () => {
  if (authenticatedRoleCache) {
    return authenticatedRoleCache;
  }

  const rolesResponse = await fetchWithRetry(
    `${STRAPI_URL}/api/users-permissions/roles`,
    {
      headers: {
        Authorization: `Bearer ${STRAPI_API_TOKEN}`,
      },
      cache: "no-store",
    },
  );

  if (!rolesResponse?.ok) {
    const status = rolesResponse?.status ?? "Unknown";
    throw new Error(`Failed to fetch authenticated role (${status})`);
  }

  const rolesData = await rolesResponse.json();
  const authenticatedRole = rolesData?.roles?.find(
    (role) => role.type === "authenticated",
  );

  if (!authenticatedRole) {
    throw new Error("Authenticated role not found");
  }

  authenticatedRoleCache = authenticatedRole.id;
  return authenticatedRoleCache;
};

export const checkUser = async () => {
  const clerkUser = await currentUser();

  if (!clerkUser) {
    return null;
  }

  if (!STRAPI_API_TOKEN || !STRAPI_URL) {
    throw new Error("Backend service configuration missing");
  }

  const cachedUser = getCachedUser(clerkUser.id);
  if (cachedUser) {
    return cachedUser;
  }

  const lookupResponse = await fetchWithRetry(
    `${STRAPI_URL}/api/users?filters[clerkId][$eq]=${clerkUser.id}`,
    {
      headers: {
        Authorization: `Bearer ${STRAPI_API_TOKEN}`,
      },
      cache: "no-store",
    },
  );

  if (!lookupResponse) {
    throw new Error("Pantry service is temporarily unavailable. Please try again.");
  }

  if (lookupResponse.ok) {
    const contentType = lookupResponse.headers.get("content-type");
    if (contentType?.includes("application/json")) {
      const existingUsers = await lookupResponse.json();
      if (Array.isArray(existingUsers) && existingUsers.length > 0) {
        setCachedUser(clerkUser.id, existingUsers[0]);
        return existingUsers[0];
      }
    }
  } else {
    const errorText = await lookupResponse.text().catch(() => "");
    console.error("Strapi user lookup failed:", lookupResponse.status, errorText);
    throw new Error("Pantry service is temporarily unavailable. Please try again.");
  }

  const authenticatedRoleId = await getAuthenticatedRoleId();
  const userData = {
    username:
      clerkUser.username ||
      clerkUser.emailAddresses[0].emailAddress.split("@")[0],
    email: clerkUser.emailAddresses[0].emailAddress,
    password: `clerk_managed_${clerkUser.id}_${Date.now()}`,
    confirmed: true,
    blocked: false,
    role: authenticatedRoleId,
    clerkId: clerkUser.id,
    firstName: clerkUser.firstName || "",
    lastName: clerkUser.lastName || "",
    imageUrl: clerkUser.imageUrl || "",
    dietaryPreference: "all",
  };

  const createResponse = await fetchWithRetry(`${STRAPI_URL}/api/users`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${STRAPI_API_TOKEN}`,
    },
    body: JSON.stringify(userData),
  });

  if (!createResponse?.ok) {
    const errorText = await createResponse?.text().catch(() => "");
    console.error("Error creating user:", createResponse?.status, errorText);
    throw new Error("Failed to sync your profile with the pantry service.");
  }

  const newUser = await createResponse.json();
  setCachedUser(clerkUser.id, newUser);
  return newUser;
};
