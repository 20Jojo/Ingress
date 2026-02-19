import { authJson } from "@/lib/authFetch";

export type UserDto = {
  id: string;
  email: string;
  displayName: string;
};

export function getUsers() {
  return authJson<UserDto[]>("/users", { method: "GET" });
}

export function getUser(userId: string) {
  return authJson<UserDto>(`/users/${userId}`, { method: "GET" });
}

