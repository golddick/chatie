import express from "express"

import path from "path"

import { clerkMiddleware } from '@clerk/express'
import authRoutes from "./routes/authRoutes"
import chatsRoutes from "./routes/chatRoutes"
import messagesRoutes from "./routes/messageRoutes"
import userRoutes from "./routes/userRoutes"
import { errorHandler } from "./middeware/errorHandler"


const app = express()

app.use(express.json())

app.use(clerkMiddleware())

app.get("/health", (req, res) => {
    res.json({status:'ok', message:'Server is running'})
} )

app.use("/api/auth", authRoutes)
app.use("/api/chats", chatsRoutes)
app.use("/api/messages", messagesRoutes)
app.use("/api/users", userRoutes)



app.use(errorHandler)

// serve frontend in production

if(process.env.NODE_ENV === "production"){
    app.use(express.static(path.join(__dirname,"../../web/dist")))

    app.get("/{*any}", (_, res) => {
        res.sendFile(path.join(__dirname, "../../web/dist/index.html"))
    })
}

export default app