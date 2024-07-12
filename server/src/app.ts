import express, { Application } from "express";
import cookieParser from "cookie-parser";
import bodyParser from "body-parser";
import cors, { CorsOptions } from "cors";
import helmet from "helmet";
import limiter from "./config/rateLimiter.js";
import ErrorMiddleware from "./middlewares/error.js";

import user from "./routes/userRoute.js";
import payment from "./routes/PaymentRoute.js";
import product from "./routes/productRoute.js";
import order from "./routes/orderRoute.js";
import notification from "./routes/notificationRoute.js";
import admin from "./routes/adminRoute.js";

const app: Application = express();

const corsOptions: CorsOptions = {
    origin: (origin, callback) => {
        const allowedOrigins = [
            "http://localhost:5173",
            "http://localhost:5174",
        ];

        if (!origin || allowedOrigins.includes(origin as string)) {
            callback(null, origin);
        } else {
            callback(new Error("Not allowed by CORS"));
        }
    },
    methods: "GET, POST, PUT, DELETE, PATCH, HEAD",
    credentials: true,
};

app.set('trust proxy', 1);
app.use(cors(corsOptions));
app.use(helmet.crossOriginResourcePolicy({ policy: "cross-origin" }));
app.use(limiter);
app.use(cookieParser());
app.use(bodyParser.urlencoded({ limit: "50mb", extended: true }));
app.use(express.json({ limit: "50mb" }));
app.use(express.static("public"));

app.use("/api/v1/user", user);
app.use("/api/v1/payment", payment);
app.use("/api/v1/product", product);
app.use("/api/v1/order", order);
app.use("/api/v1/notification",notification);
app.use("/api/v1/admin", admin);

app.use(ErrorMiddleware);

export default app;