import http from 'http';
import Redis from "ioredis";
import dotenv from "dotenv";
import { parse } from 'graphql';
import { ApolloServer } from '@apollo/server';
import { expressMiddleware } from '@apollo/server/express4';
import { ApolloServerPluginLandingPageLocalDefault } from "@apollo/server/plugin/landingPage/default";

dotenv.config();

import { resolvers } from './graphql/resolvers.js';
import { typeDefs } from './graphql/typeDefs.js';
import app from './app.js';
import connectDB from './config/db.js';
import { authenticate, CustomRequest } from './middlewares/auth.middleware.js';

export const redis = new Redis.default();
const PORT = process.env.PORT || 8081;

const httpServer = http.createServer(app);

const server = new ApolloServer({
    typeDefs,
    resolvers,
    introspection: true,
    csrfPrevention: true,
    plugins: [
        ApolloServerPluginLandingPageLocalDefault({ embed: true })
    ]
});

async function startServer() {
    connectDB();
    await server.start();

    app.use(
        '/graphql',
        // cors(corsOptions),
        // express.json({ limit: '50mb' }),
        expressMiddleware(server, {
            context: async ({ req, res }): Promise<any> => {
                const customReq = req as CustomRequest;
                try {
                    const query = customReq.body.query;
                    if (query) {
                        const parsedQuery = parse(query);

                        for (const definition of parsedQuery.definitions) {
                            if (definition.kind === 'OperationDefinition') {
                                const operationName = definition.name?.value;
                                if (operationName === 'GetUser') {
                                    const user = await authenticate(customReq, res);
                                    customReq.user = user;
                                    break;
                                }
                            }
                        }
                    }
                    return { req: customReq, res };
                } catch (error) {
                    console.error(error);
                    throw new Error("Error in context function");
                }
            }
        }),
    );

    await new Promise<void>((resolve) => httpServer.listen({ port: PORT }, resolve));
    console.log(`🚀 Server ready at http://localhost:${PORT}/`);
}

startServer();