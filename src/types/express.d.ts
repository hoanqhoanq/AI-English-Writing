import { UserRole, CefrLevel } from "./index";

declare global {
    namespace Express {
        interface Request {
            user?: {
                id: string;
                email: string;
                role: UserRole;
                name: string;
                level: CefrLevel;
            };
        }
    }
}
export {};
