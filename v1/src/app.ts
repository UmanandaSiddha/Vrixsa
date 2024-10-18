import express, { Application } from 'express';
import cors, { CorsOptions } from 'cors';
import cookieParser from "cookie-parser";
import bodyParser from "body-parser";
import helmet from "helmet";
import limiter from './config/rateLimiter.js';
import ErrorMiddleware from './middlewares/error.js';

const app: Application = express();

export const corsOptions: CorsOptions = {
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

app.use(cors(corsOptions));
app.use(helmet.crossOriginResourcePolicy({ policy: "cross-origin" }));
app.use(limiter);
app.use(cookieParser());
app.use(express.json({ limit: "50mb" }));
app.use(bodyParser.urlencoded({ limit: "50mb", extended: true }));
app.use(express.static("public"));

app.use(ErrorMiddleware);

export default app;