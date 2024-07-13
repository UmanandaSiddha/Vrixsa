export const emailQueueName = "vrixsa_email-queue";

export const redisConnection = {
    host: process.env.REDIS_HOST, 
    port: process.env.REDIS_PORT,        
}

export const jobOptions = {
    removeOnComplete: true,
    attempts: 2,
    backoff: {
        type: "exponential",
        delay: 1000
    }
}
