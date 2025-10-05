import express from "express"
import { getAllOrders } from '../controllers/ordersController.js'

/**
 * @name router
 * @description Express router for handling order-related routes.
 * @type {object}
 */
const router = express.Router()

/**
 * @route GET /
 * @description Route to get all orders.
 * @access Public
 */
router.get('/', getAllOrders);

export default router;
