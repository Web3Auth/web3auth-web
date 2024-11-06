/** Merge classes with tailwind-merge with clsx full feature */
import clsx, { ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

const cache = new Map<string, string>();

/** Merge classes with tailwind-merge with clsx full feature and memoization */
export function cn(...inputs: ClassValue[]) {
  // Create a cache key using JSON.stringify
  const cacheKey = JSON.stringify(inputs);

  // Check if the result is already cached
  if (cache.has(cacheKey)) {
    return cache.get(cacheKey)!;
  }

  // If not cached, compute the result
  const result = twMerge(clsx(inputs));

  // Store the result in the cache
  cache.set(cacheKey, result);

  return result;
}
