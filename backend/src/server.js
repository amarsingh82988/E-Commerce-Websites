// src/server.js
import http from "http";
import app from "./app.js";
import { env } from "./config/env.js";

const PORT = env.port || 3001;
const server = http.createServer(app);

server.listen(PORT, "0.0.0.0", () => {
  console.log(`Server listening on port ${PORT}`);
});
