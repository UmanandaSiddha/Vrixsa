import dotenv from "dotenv";
import { httpServer } from "./app.js";
import connectDB from "./config/db.js";

dotenv.config({
    path: "./.env",
});

const startServer = () => {
    httpServer.listen(process.env.PORT || 8080, () => {
        console.info(
            `📑 Visit the documentation at: http://localhost:${process.env.PORT || 8080
            }`
        );
        console.log("⚙️  Server is running on port: " + process.env.PORT);
    });
};

try {
    await connectDB();
    startServer();
} catch (err) {
    console.log("Mongo db connect error: ", err);
}