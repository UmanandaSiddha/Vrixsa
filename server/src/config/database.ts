import mongoose from "mongoose";

export default function connectDatabase(): void {

    if (!process.env.MONGO_URI) {
        console.error("MONGO_URI is not defined in environment variables");
        process.exit(1);
    }

    mongoose
        .connect(process.env.MONGO_URI)
        .then((data) => {
            console.log(`Mongodb connected: ${data.connection.host}`);
        })
        .catch((error) => {
            console.error(`Error connecting to MongoDB: ${error.message}`);
            process.exit(1);
        });
}