import Fastify from "fastify";
import fastifyStatic from "@fastify/static";
import fastifyFormbody from "@fastify/formbody";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { config } from "./config.js";
import { registerRoutes } from "./web/routes.js";
import { startPoller } from "./sheets/poller.js";

const __dirname = dirname(fileURLToPath(import.meta.url));

const app = Fastify({ logger: { level: "info" } });
await app.register(fastifyFormbody);
await app.register(fastifyStatic, {
  root: resolve(__dirname, "./web/public"),
  prefix: "/",
});
await registerRoutes(app);

startPoller();

try {
  await app.listen({ port: config.PORT, host: config.HOST });
  console.log(`\n  Intake service listening on http://${config.HOST}:${config.PORT}\n`);
} catch (err) {
  app.log.error(err);
  process.exit(1);
}
