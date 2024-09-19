import { Redis } from "ioredis"

const host = process.env.REDIS_HOST
const password = process.env.REDIS_PASSWORD
const port = process.env.REDIS_PORT

if (!host || !password || !port) {
  throw new Error ("Please provide REDIS_HOST, REDIS_PASSWORD, and REDIS_PORT in the environment variables")
}

const redis = new Redis({
  host,
  password,
  port: parseInt(port),
})


// connecting to redis
redis.connect().then(() => {
  console.log("Connected to Redis")
}).catch((err) => {
  console.log("Error connecting to Redis", err)
})

export default redis;