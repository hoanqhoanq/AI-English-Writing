import { z } from "zod";

export const RegisterSchema = z
    .object({
        name: z.string().min(2, "Tên phải có ít nhất 2 ký tự"),
        email: z.string().email("Email không hợp lệ"),
        password: z.string().min(6, "Mật khẩu phải có ít nhất 6 ký tự"),
        confirmPassword: z.string(),
        level: z.enum(["A1", "A2", "B1", "B2", "C1", "C2"]).default("B1"),
    })
    .refine((data) => data.password === data.confirmPassword, {
        message: "Mật khẩu xác nhận không khớp",
        path: ["confirmPassword"],
    });

export const LoginSchema = z.object({
    email: z.string().email("Email không hợp lệ"),
    password: z.string().min(1, "Vui lòng nhập mật khẩu"),
});

export const UpdateProfileSchema = z.object({
    name: z.string().min(2, "Tên phải có ít nhất 2 ký tự").optional(),
    avatar: z.string().optional(),
    level: z.enum(["A1", "A2", "B1", "B2", "C1", "C2"]).optional(),
    target: z
        .enum(["General English", "TOEIC", "IELTS", "Communication", "Academic English"])
        .optional(),
    dailyGoal: z.number().min(1).max(50).optional(),
});
