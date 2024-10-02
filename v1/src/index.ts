import express from 'express';
import cors from 'cors';
import http from 'http';
import dotenv from "dotenv";
import { connect } from 'mongoose';
import { ApolloServer } from '@apollo/server';
import { expressMiddleware } from '@apollo/server/express4';
import { ApolloServerPluginLandingPageLocalDefault } from "@apollo/server/plugin/landingPage/default";

dotenv.config();

import { resolvers } from './graphql/resolvers.js';
import { typeDefs } from './graphql/typeDefs.js';

const app = express();

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
    await connect(process.env.MONGO_URI as string)
    await server.start();

    app.use(
        '/graphql',
        cors(),
        express.json({ limit: '50mb' }),
        expressMiddleware(server, {
            context: async ({ req, res }): Promise<any> => {
                try {
                    if (req.url === '/' && req.body.operationName === 'IntrospectionQuery') {
                        return { req, res }
                    }
                    // const { user } = await authenticate({ req })
                    return { req, res };
                } catch (error) {
                    console.log(error);
                }
            }
        }),
    );

    app.use(cors());

    await new Promise<void>((resolve) => httpServer.listen({ port: process.env.PORT || 4000 }, resolve));
    console.log(`🚀 Server ready at http://localhost:${process.env.PORT || 4000}/`);
}

startServer();