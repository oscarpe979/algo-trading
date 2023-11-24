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

//Gets __dirname variable as it's tricky with ES6 modules
const filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(filename);

// Environment Variables
dotenv.config();

// Express init and port specification
const app = express();
const port = process.env.PORT || 5000;

/** --------------------------------------------------------------------------------------------------------------------
 *                                          MIDDLEWARE
 -----------------------------------------------------------------------------------------------------------------------*/
app.use(express.json());
app.use(express.urlencoded({extended:false}));

// MongoDB
const db = process.env.MONGO_URI;
mongoose
	.connect(db, { useNewUrlParser: true, useUnifiedTopology: true })
	.then(() => console.log("MongoDB Connected..."))
	.catch((err) => console.log(err));

/** --------------------------------------------------------------------------------------------------------------------
 *                                          ROUTES
 -----------------------------------------------------------------------------------------------------------------------*/
app.use('/api/orders', ordersRoutes);

/** --------------------------------------------------------------------------------------------------------------------
 *                                          SERVE FRONT END AND INIT TRADINGN ENGINE
 -----------------------------------------------------------------------------------------------------------------------*/

//Serves front end
if(process.env.NODE_ENV === 'production'){
	app.use(express.static(path.join(__dirname, '../frontend/build')));
	app.get('*', (req, res) => res.sendFile(path.resolve(__dirname, '../', 'frontend', 'build', 'index.html')));
}

//Initiate running strategies
const init = async () => {
	const runStrategies = () => {
		//pivotPointsStrategy();
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
