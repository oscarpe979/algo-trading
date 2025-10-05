/**
 * @file server.js
 * @description This is the main server file for the backend of the application. It sets up the Express server, connects to MongoDB, defines routes, and initializes trading strategies.
 */

/** --------------------------------------------------------------------------------------------------------------------
 *                                          IMPORTS
-----------------------------------------------------------------------------------------------------------------------*/
import dotenv from "dotenv";
import express from "express";
import mongoose from "mongoose";
import path from "path";
import { fileURLToPath } from "url";

// Route imports
import ordersRoutes from './routes/ordersRoutes.js'

// Strategies
import pivotPointsStrategy from "./strategies/pivot_points/pivot_points.js";

/** --------------------------------------------------------------------------------------------------------------------
 *                                          TESTS
-----------------------------------------------------------------------------------------------------------------------*/
// import Alpaca from "@alpacahq/alpaca-trade-api";
// const alpacaOptions = {
// 	keyId: process.env.ALPACA_KEY_ID,
// 	secretKey: process.env.ALPACA_SECRET_KEY,
// 	paper: true,
// };

// const alpaca = new Alpaca(alpacaOptions);

/** --------------------------------------------------------------------------------------------------------------------
 *                                          INITIALIZERS
-----------------------------------------------------------------------------------------------------------------------*/

// In ES6 modules, `__dirname` is not available by default. This code gets the current file's URL, converts it to a path, and then gets the directory name.
const filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(filename);

// Load environment variables from a `.env` file into `process.env`.
dotenv.config();

// Initialize the Express application.
const app = express();
// Set the port for the server, using the value from environment variables or defaulting to 5000.
const port = process.env.PORT || 5000;

/** --------------------------------------------------------------------------------------------------------------------
 *                                          MIDDLEWARE
 -----------------------------------------------------------------------------------------------------------------------*/
// Middleware to parse incoming requests with JSON payloads.
app.use(express.json());
// Middleware to parse incoming requests with URL-encoded payloads.
app.use(express.urlencoded({extended:false}));

// --- MongoDB Connection ---
// Get the MongoDB connection URI from environment variables.
const db = process.env.MONGO_URI;
// Connect to the MongoDB database using Mongoose.
mongoose
	.connect(db, { useNewUrlParser: true, useUnifiedTopology: true })
	.then(() => console.log("MongoDB Connected..."))
	.catch((err) => console.log(err));

/** --------------------------------------------------------------------------------------------------------------------
 *                                          ROUTES
 -----------------------------------------------------------------------------------------------------------------------*/
// Mount the orders routes at the '/api/orders' endpoint.
app.use('/api/orders', ordersRoutes);

/** --------------------------------------------------------------------------------------------------------------------
 *                                          SERVE FRONT END AND INIT TRADINGN ENGINE
 -----------------------------------------------------------------------------------------------------------------------*/

// --- Serve Frontend in Production ---
// Check if the environment is set to 'production'.
if(process.env.NODE_ENV === 'production'){
    // Serve the static files from the React app's 'build' directory.
	app.use(express.static(path.join(__dirname, '../frontend/build')));
    // For any other request, serve the 'index.html' file from the build directory.
    // This is necessary for client-side routing to work correctly.
	app.get('*', (req, res) => res.sendFile(path.resolve(__dirname, '../', 'frontend', 'build', 'index.html')));
}

// --- Initialize Trading Engine ---
// This function is responsible for starting the trading strategies.
const init = async () => {
    // This function runs the imported trading strategies.
	const runStrategies = () => {
        // Execute the pivot points trading strategy.
		pivotPointsStrategy();
	};

    // Call the function to run the strategies.
	runStrategies();
};

/** --------------------------------------------------------------------------------------------------------------------
 *                                          PORT LISTEN
 -----------------------------------------------------------------------------------------------------------------------*/

// Start the Express server and listen for incoming requests on the specified port.
app.listen(port, () => {
	// Initialize the trading engine when the server starts.
	init();
	// Log a message to the console indicating that the server has started successfully.
	console.log(`Server started on port ${port}`);
});
