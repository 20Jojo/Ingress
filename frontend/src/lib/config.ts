// Base URL of the Ingress API. Set NEXT_PUBLIC_API_BASE_URL in frontend/.env.local
// (see frontend/.env.example); without it the app targets the Docker API.
export const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8080";
