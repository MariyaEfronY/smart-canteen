"use client";
import { useForm } from "react-hook-form";
import api from "@/lib/api";
import { useRouter } from "next/router";

type Props = { type: "login" | "signup" };

export default function AuthForm({ type }: Props) {
  const router = useRouter();
  const { register, handleSubmit } = useForm();

  const onSubmit = async (data: any) => {
    try {
      const url = type === "login" ? "/auth/login" : "/auth/signup";
      await api.post(url, data);
      router.push(type === "login" ? "/" : "/login");
    } catch (err: any) {
      alert(err.response?.data?.message || "Error");
    }
  };

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      className="max-w-md mx-auto p-6 border rounded-lg shadow bg-background"
    >
      {type === "signup" && (
        <input
          {...register("name")}
          placeholder="Name"
          className="w-full p-2 border mb-2"
        />
      )}
      <input
        {...register("email")}
        placeholder="Email"
        type="email"
        className="w-full p-2 border mb-2"
      />
      <input
        {...register("password")}
        placeholder="Password"
        type="password"
        className="w-full p-2 border mb-2"
      />
      {type === "signup" && (
        <select {...register("role")} className="w-full p-2 border mb-2">
          <option value="student">Student</option>
          <option value="admin">Admin</option>
        </select>
      )}
      <button
        type="submit"
        className="bg-foreground text-background px-4 py-2 rounded"
      >
        {type === "login" ? "Login" : "Signup"}
      </button>
    </form>
  );
}
