const BACKEND_API_URL =
  process.env.BACKEND_API_URL || "http://127.0.0.1:4000/api";
const BACKEND_INTERNAL_API_KEY =
  process.env.BACKEND_INTERNAL_API_KEY || "prepai-internal-dev-key";

export const checkUser = async (user) => user || null;

export const getBackendAuthHeaders = async (user) => {
  const authUser = await checkUser(user);

  if (!authUser?.id) {
    return null;
  }

  return {
    "x-internal-api-key": BACKEND_INTERNAL_API_KEY,
    "x-clerk-user-id": authUser.id,
    "x-user-email": authUser.email || "",
    "x-user-username":
      authUser.username || authUser.email?.split("@")[0] || "",
    "x-user-first-name": authUser.firstName || "",
    "x-user-last-name": authUser.lastName || "",
    "x-user-image-url": authUser.imageUrl || "",
  };
};

export const backendFetch = async (path, user, options = {}) => {
  const headers = await getBackendAuthHeaders(user);

  if (!headers) {
    return null;
  }

  const response = await fetch(`${BACKEND_API_URL}${path}`, {
    ...options,
    headers: {
      ...headers,
      ...(options.headers || {}),
    },
    cache: "no-store",
  });

  return response;
};
