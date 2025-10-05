export interface User {
  id: string;
  name: string;
  email: string;
  role: "student" | "admin";
}

export interface ApiResponse<T = unknown> {
  data: T;
  message?: string;
  success: boolean;
}

export interface LoginData {
  email: string;
  password: string;
}

export interface SignupData {
  name: string;
  email: string;
  password: string;
  role: "student" | "admin";
}