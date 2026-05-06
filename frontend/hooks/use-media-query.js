import { useSyncExternalStore } from "react";

function subscribeToMediaQuery(query, callback) {
  if (typeof window === "undefined") {
    return () => {};
  }

  const mediaQueryList = window.matchMedia(query);
  const listener = () => callback();

  mediaQueryList.addEventListener("change", listener);

  return () => {
    mediaQueryList.removeEventListener("change", listener);
  };
}

function getMediaQuerySnapshot(query, fallback) {
  if (typeof window === "undefined") {
    return fallback;
  }

  return window.matchMedia(query).matches;
}

export function useMediaQuery(query, fallback = false) {
  return useSyncExternalStore(
    (callback) => subscribeToMediaQuery(query, callback),
    () => getMediaQuerySnapshot(query, fallback),
    () => fallback,
  );
}
