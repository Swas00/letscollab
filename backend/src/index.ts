import http from "http";
import dotenv from "dotenv";
dotenv.config();

import { app } from "./app";
import { initSocket } from "./socket";
import { reconcilePersistentUsers } from "./services/accountStorage.service";

const PORT = process.env.PORT || 5001;
const server = http.createServer(app);

// Initialize Socket.IO
initSocket(server);

// Ensure all registered accounts are preserved and synchronized with the database
reconcilePersistentUsers().catch((err) => {
  console.error("Failed to reconcile persistent users:", err);
});

server.listen(PORT, () => {
  console.log(`🚀 LetsCollab Backend Server running on http://localhost:${PORT}`);
  console.log(`📡 Real-time Socket.IO initialized`);
});
