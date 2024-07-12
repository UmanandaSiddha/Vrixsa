import app from "./app.js";
import dotenv from "dotenv";
import connectDatabase from "./config/database.js";
import "./utils/emailQueue.js";
import Redis from "ioredis";
import { Request, Response } from "express";

// Handling Uncaught Exception
process.on("uncaughtException", (err: Error) => {
    console.log(`Error: ${err.message}`);
    console.log(`Shutting down the server due to Uncaught Exception`);
    
    process.exit(1);
});

dotenv.config();

export const redis = new Redis.default();
const PORT = process.env.PORT || 4000;

connectDatabase();

app.get("/", (req: Request, res: Response) => {
    res.status(200).json({
        message: "Server Working!"
    })
});

const server = app.listen( PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});

// Unhandled Promise Rejection
process.on("unhandledRejection", (err: any) => {
    console.log(`Error: ${err.message}`);
    console.log(`Shutting down the server due to Unhandled Promise Rejection`);

    server.close(() => {
        process.exit(1);
    });
});