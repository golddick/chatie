import {Socket, Server as SocketServer} from "socket.io"
import {Server as HttpServer} from "http"
import {verifyToken} from "@clerk/express"
import { Message } from "../models/Message";
import { Chat } from "../models/Chat";
import { User } from "../models/User";


interface SocketWithUserId extends Socket {
    userId?: string;
}

export const onlineUsers: Map<string, string> = new Map()


export const initializeSocket = (httpServer: HttpServer) => {

    const allowedOrigins = [
       process.env.MOBILE_ORIGIN_URL! || "http://localhost:8081",
        process.env.FRONTEND_URL! || "http://localhost:5173",
        "http://localhost:5173",
    ]

    const io = new SocketServer(httpServer, {cors:{origin: allowedOrigins}})

    // verify socket connection - if the user is authenticated, we will store the user iid in the socket

    io.use(async( socket, next) => {
        const token = socket.handshake.auth.token; // this is what user will send from client
        if(!token) return next(new Error("Authentication error: No token provided"));

        try{

            const session = await verifyToken(token, {secretKey: process.env.CLERK_SECRET_KEY!});

            const clerkId = session.sub

            const user = await User.findOne({clerkId});
            if (!user) return next(new Error("Authentication error: User not found"));

            (socket as SocketWithUserId).userId = user._id.toString();


            next()
        } catch (error: any) {
            return next(new Error(`Authentication error: ${error}`));
        }
    })

    //this "connection" event name is special and should be written 
    // its an event that triggered when a new client connects to the server 

    io.on("connection", (socket) => {
        const userId = (socket as SocketWithUserId).userId;
        if (!userId) {
            socket.disconnect(true);
            return;
        }

        //send list of current onlien users to newy connected client 
        socket.emit("online-users",{userIds: Array.from(onlineUsers.keys())})

        //store user in onlineUsers map
        onlineUsers.set(userId, socket.id);

        //notify others that is current user is online 
        socket.broadcast.emit("user-online", {userId})

        socket.join(`user:${userId}`)

        // socket.on("join-chat", (chatId:string) => {
        //     socket.join(`chat:${chatId}`)
        // })

           socket.on("join-chat", async (chatId:string) => {
          try {
                const isParticipant = await Chat.exists({ _id: chatId, participants: userId });
                if (!isParticipant) {
                    socket.emit("socket-error", {message: "chat not found"});
                    return;
                }
                socket.join(`chat:${chatId}`)
            } catch (error) {
                socket.emit("socket-error", {message: "Failed to join chat"});
            }
        })

        socket.on("leave-chat", (chatId:string) => {
            socket.leave(`chat:${chatId}`)
        })

        //hanlde sending messages
        socket.on("send-message", async (data: {chatId:string, text:string}) => {

            try{
                const {chatId, text} = data;

                const chat = await Chat.findOne({
                    _id:chatId,
                    participants:userId,
                });

                if(!chat) {
                    socket.emit("socket-error", {message: "chat not found"});
                    return;
                }

                const message = await Message.create({
                    chat:chatId,
                    sender:userId,
                    text,
                });

                chat.lastMessage = message._id;
                chat.lastMessageAt = new Date();
                await chat.save()

                await message.populate("sender", "name email avatar")

                //emit to chat room (for users inside the chat)

                // io.to(`chat:${chatId}`).emit("new-message", message)

                // //also emit to participants personal rooms (for chat list view)

                // for (const participantId of chat.participants) {
                //     io.to(`user:${participantId}`).emit("new-message", message )
                // }

                // emit once to the chat room and to each participant's personal room (for chat list view)
                const rooms = [
                    `chat:${chatId}`,
                    ...chat.participants.map((participantId) => `user:${participantId}`),
                ];
                io.to(rooms).emit("new-message", message)

            } catch (error) {
                socket.emit("socket-error", {message: "Faild to send message "})
            }
        })

        //todo: later
        socket.on("typing", async (data) => {} )

        // socket.on("disconnect", () => {
        //     onlineUsers.delete(userId);

        //     //notify others
        //     socket.broadcast.emit("user-offline", {userId})
        // })


          socket.on("disconnect", async () => {
            try {
                const remaining = await io.in(`user:${userId}`).fetchSockets();
                if (remaining.length > 0) return;
            } catch (error) {
                console.error("Failed to check remaining sockets", error);
            }
            onlineUsers.delete(userId);

            //notify others
            socket.broadcast.emit("user-offline", {userId})
        })
    } )

    return io
}