import { Resolvers } from '../generated/graphql.js';
import { userMutations } from './resolvers/users/mutations.js';
import { userResolvers } from './resolvers/users/query.js';

export const resolvers: Resolvers = {
    Query: {
        ...userResolvers,
    },
    Mutation: {
        ...userMutations,
    }
};