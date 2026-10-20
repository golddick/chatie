import app from "./src/app";
import { connectDB } from "./src/config/database";

 const PORT = process.env.PORT || 4000;

 connectDB().then(() => {
    app.listen(PORT, () => {
        console.log(`Server is running on port ${PORT}`);
    });
 })
 .catch((error) => {
    console.error("failed to start the server", error);
    process.exit(1)
 })