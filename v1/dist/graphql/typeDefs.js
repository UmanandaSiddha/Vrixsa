import { readFile } from "fs/promises";
import path from "path";
import { fileURLToPath } from "node:url";
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
// const baseGraphQLConfig = await readFile(path.join(__dirname, 'schema.graphql'), 'utf-8')
const userGraphQLConfig = await readFile(path.join(__dirname, 'resolvers/users/user.graphql'), 'utf-8');
export const typeDefs = [
    // baseGraphQLConfig,
    userGraphQLConfig,
];
