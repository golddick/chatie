import {Router} from "express";
import { protectRoute } from "../middeware/auth";
import { getMessages } from "../controllers/messageConroller";

const router = Router()

router.get("/chat/:chatId", protectRoute, getMessages )

export default router;