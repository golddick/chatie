import app from "./src/app";
import { connectDB } from "./src/config/database";
import {createServer} from "http";
import { initializeSocket } from "./src/utils/socket";

 const PORT = Number(process.env.PORT) || 4000;

 const httpServer = createServer(app);

 initializeSocket(httpServer);

 connectDB().then(() => {
    httpServer.listen(PORT, "0.0.0.0", () => {
        console.log(`Server is running on port ${PORT}`);
    });
 })
 .catch((error) => {
    console.error("failed to start the server", error);
    process.exit(1)
 })