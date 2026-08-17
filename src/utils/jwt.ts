import jwt from "jsonwebtoken";
import { config } from "../config/env";

export interface IJwtPayload {
    id: string;
    email: string;
    role: "user" | "admin";
    name: string;
    level: string;
}

export const signToken = (payload: IJwtPayload): string => {
    return jwt.sign(payload, config.jwtSecret, {
        expiresIn: config.jwtExpiresIn as any,
    });
};

export const verifyToken = (token: string): IJwtPayload => {
    return jwt.verify(token, config.jwtSecret) as IJwtPayload;
};
