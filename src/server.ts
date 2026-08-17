import dotenv from "dotenv";
dotenv.config();

import app from "./app";
import { connectDatabase } from "./config/database";

const PORT = Number(process.env.PORT) || 3000;

const startServer = async () => {
    app.listen(PORT, "0.0.0.0", () => {
        console.log(`Server is running on http://0.0.0.0:${PORT}`);
    });

    await connectDatabase();
};

startServer();

