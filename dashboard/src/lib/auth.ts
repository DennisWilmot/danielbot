import { cookies } from "next/headers";

export function validateCredentials(
  username: string,
  password: string
): boolean {
  return (
    username === (process.env.MOCK_USERNAME || "admin") &&
    password === (process.env.MOCK_PASSWORD || "admin123")
  );
}

export async function isAuthenticated(): Promise<boolean> {
  const cookieStore = await cookies();
  return cookieStore.get("auth")?.value === "true";
}
