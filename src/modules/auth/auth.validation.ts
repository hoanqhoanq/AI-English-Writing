import { z } from "zod";

export const RegisterSchema = z
    .object({
        name: z.string().min(2, "Tên phải có ít nhất 2 ký tự"),
        email: z.string().email("Email không hợp lệ"),
        password: z.string().min(8, "Mật khẩu phải có ít nhất 8 ký tự"),
        confirmPassword: z.string(),
    })
    .refine((data) => data.password === data.confirmPassword, {
        message: "Mật khẩu xác nhận không khớp",
        path: ["confirmPassword"],
    });

export const LoginSchema = z.object({
    email: z.string().email("Email không hợp lệ"),
    password: z.string().min(1, "Vui lòng nhập mật khẩu"),
});

export const CreateUserSchema = z.object({
    name: z.string().min(2, "Tên phải có ít nhất 2 ký tự"),
    email: z.string().email("Email không hợp lệ"),
    password: z.string().min(8, "Mật khẩu phải có ít nhất 8 ký tự"),
    role: z.enum(["user", "admin"]).default("user"),
});

export const UpdateProfileSchema = z.object({
    name: z.string().min(2, "Tên phải có ít nhất 2 ký tự").optional(),
    avatar: z.string().optional(),
    dailyGoal: z.number().min(1).max(50).optional(),
});
