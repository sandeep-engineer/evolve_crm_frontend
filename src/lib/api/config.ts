const DEFAULT_LOCAL_API_BASE_URL = "http://localhost:3000";

export const API_BASE_URL = (
  process.env.NEXT_PUBLIC_API_BASE_URL || DEFAULT_LOCAL_API_BASE_URL
).replace(/\/+$/, "");
