export const emailQueueName = "vrixsa_email-queue";

export const redisConnection = {
    host: "127.0.0.1", 
    port: 6379,        
}

export const jobOptions = {
    removeOnComplete: true,
    attempts: 2,
    backoff: {
        type: "exponential",
        delay: 1000
    }
}
