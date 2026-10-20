import express from "express"

import authRoutes from "./routes/authRoutes"
import chatsRoutes from "./routes/chatRoutes"
import messagesRoutes from "./routes/messageRoutes"
import userRoutes from "./routes/userRoutes"


const app = express()

app.use(express.json())

app.get("/health", (req, res) => {
    res.json({status:'ok', message:'Server is running'})
} )

app.use("/api/auth", authRoutes)
app.use("/api/chats", chatsRoutes)
app.use("/api/messages", messagesRoutes)
app.use("/api/users", userRoutes)

export default app