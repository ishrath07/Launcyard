const RESERVED = new Set([
  "admin",
  "api",
  "app",
  "login",
  "signup",
  "onboarding",
  "s",
  "preview",
  "www",
  "store",
  "stores",
]);

export function slugify(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/['"]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 40);
}

export function slugError(slug: string) {
  if (slug.length < 3) return "Use at least 3 characters.";
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)) {
    return "Use lowercase letters, numbers, and hyphens only.";
  }
  if (RESERVED.has(slug)) return "That address is reserved.";
  return null;
}
