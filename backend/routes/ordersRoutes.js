import express from "express"
import { getAllOrders } from '../controllers/ordersController.js'
const router = express.Router()

router.get('/', getAllOrders);

export default router;
