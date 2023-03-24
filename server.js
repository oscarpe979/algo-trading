/** --------------------------------------------------------------------------------------------------------------------
 *                                          IMPORTS
 -----------------------------------------------------------------------------------------------------------------------*/
import dotenv from "dotenv";
import express from "express";
import mongoose from "mongoose";

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
// Environment Variables
dotenv.config();

// Express init and port specification
const app = express();
const port = process.env.PORT || 5000;

// MongoDB
const db = process.env.MONGO_URI;
mongoose
	.connect(db, { useNewUrlParser: true, useUnifiedTopology: true })
	.then(() => console.log("MongoDB Connected..."))
	.catch((err) => console.log(err));

/** --------------------------------------------------------------------------------------------------------------------
 *                                          LOGIC
 -----------------------------------------------------------------------------------------------------------------------*/
const init = async () => {
	const runStrategies = () => {
		pivotPointsStrategy();
	};

	runStrategies();
};

/** --------------------------------------------------------------------------------------------------------------------
 *                                          PORT LISTEN
 -----------------------------------------------------------------------------------------------------------------------*/

app.listen(port, () => {
	init();
	console.log(`Server started on port ${port}`);
});
