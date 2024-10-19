import express, { Application } from 'express';
import cors, { CorsOptions } from 'cors';
import cookieParser from "cookie-parser";
import bodyParser from "body-parser";
import helmet from "helmet";
import limiter from './config/rateLimiter.js';
import ErrorMiddleware from './middlewares/error.js';
import useragent from 'express-useragent';

const app: Application = express();

const corsOptions: CorsOptions = {
    origin: (origin, callback) => {
        const allowedOrigins = [
            "http://localhost:5173",
            "http://localhost:8081",
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

// app.use(limiter);
app.use(cookieParser());
app.use(cors(corsOptions));
app.set('trust proxy', process.env.NODE_ENV === 'production' ? true : false);
app.use(useragent.express());
app.use(express.static("public"));
app.use(express.json({ limit: "50mb" }));
app.use(bodyParser.urlencoded({ limit: "50mb", extended: true }));
app.use(helmet.crossOriginResourcePolicy({ policy: "cross-origin" }));

app.use(ErrorMiddleware);

export default app;