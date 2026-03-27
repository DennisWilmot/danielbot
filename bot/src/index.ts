import dotenv from "dotenv";
dotenv.config({ path: "../.env" });

import { registerHandlers } from "./register.js";
import { startServer } from "./server.js";

registerHandlers();
startServer().catch(console.error);
