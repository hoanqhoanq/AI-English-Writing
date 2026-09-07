import jwt from "jsonwebtoken";
import crypto from "crypto";
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

/**
 * Refresh tokens are opaque random strings (not JWTs). Only their SHA-256 hash is
 * persisted in refresh_token_sessions, so a leaked DB never exposes usable tokens.
 */
export const generateRefreshToken = (): string => crypto.randomBytes(48).toString("hex");

export const hashRefreshToken = (rawToken: string): string =>
    crypto.createHmac("sha256", config.refreshTokenSecret).update(rawToken).digest("hex");
