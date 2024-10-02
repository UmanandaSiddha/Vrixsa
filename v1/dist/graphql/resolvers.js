import { userMutations } from './resolvers/users/mutations.js';
import { userResolvers } from './resolvers/users/query.js';
export const resolvers = {
    Query: {
        ...userResolvers,
    },
    Mutation: {
        ...userMutations,
    }
};
