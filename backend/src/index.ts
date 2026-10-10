import http from "http";
import dotenv from "dotenv";
dotenv.config();

import { app } from "./app";
import { initSocket } from "./socket";

const PORT = process.env.PORT || 5001;
const server = http.createServer(app);

// Initialize Socket.IO
initSocket(server);

server.listen(PORT, () => {
  console.log(`🚀 NeoStats Backend Server running on http://localhost:${PORT}`);
  console.log(`📡 Real-time Socket.IO initialized`);
});
