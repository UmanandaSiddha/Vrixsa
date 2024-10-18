import express from 'express';
import cors from 'cors';
import http from 'http';
import dotenv from "dotenv";
import Redis from "ioredis";
import { connect } from 'mongoose';
import { ApolloServer } from '@apollo/server';
import { expressMiddleware } from '@apollo/server/express4';
import { ApolloServerPluginLandingPageLocalDefault } from "@apollo/server/plugin/landingPage/default";

dotenv.config();

import { resolvers } from './graphql/resolvers.js';
import { typeDefs } from './graphql/typeDefs.js';
import app, { corsOptions } from './app.js';

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
    await connect(process.env.MONGO_URI as string)
    await server.start();

    app.use(
        '/graphql',
        cors(corsOptions),
        express.json({ limit: '50mb' }),
        expressMiddleware(server, {
            context: async ({ req, res }): Promise<any> => {
                try {
                    if (req.url === '/' && req.body.operationName === 'IntrospectionQuery') {
                        return { req, res }
                    }
                    // if (req.body.query.includes('loginUser') && req.body.variables.password) {
                    //     return { req, res }
                    // }
                    // const { user } = await authenticate({ req })
                    // return { req, res, user };
                    return { req, res };
                } catch (error) {
                    console.log(error);
                }
            }
        }),
    );

    await new Promise<void>((resolve) => httpServer.listen({ port: PORT }, resolve));
    console.log(`🚀 Server ready at http://localhost:${PORT}/`);
}

startServer();