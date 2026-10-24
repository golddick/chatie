import {Router} from "express";
import { protectRoute } from "../middeware/auth";
import { getUsers } from "../controllers/userController";

const router = Router()

router.get("/", protectRoute, getUsers)

export default router