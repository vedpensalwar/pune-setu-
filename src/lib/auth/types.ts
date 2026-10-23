export type Role = "CITIZEN" | "MUNICIPAL_OFFICER" | "ADMIN";

export type AccountStatus = "ACTIVE" | "SUSPENDED" | "DEACTIVATED";

export interface User {
  id: string;
  name: string;
  email: string;
  passwordHash: string;
  role: Role;
  status: AccountStatus;
  department?: string;
  departmentId?: string;
  ward?: string;
  wardId?: string;
  createdAt: string;
  updatedAt: string;
  lastLoginAt?: string;
}

export type SafeUser = Omit<User, "passwordHash">;

export interface SessionPayload {
  sub: string;
  email: string;
  name: string;
  role: Role;
  department?: string;
  departmentId?: string;
  ward?: string;
  wardId?: string;
  status: AccountStatus;
}
