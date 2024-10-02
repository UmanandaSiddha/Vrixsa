import type { CodegenConfig } from '@graphql-codegen/cli';

const config: CodegenConfig = {
    overwrite: true,
    schema: "src/**/*.graphql",
    generates: {
        "src/generated/graphql.ts": {
            plugins: [
                "typescript",
                "typescript-resolvers",
                {
                    add: {
                        content: "/* eslint-disable @typescript-eslint/no-empty-object-type */",
                    },
                },
            ],
        },
    },
};

export default config;