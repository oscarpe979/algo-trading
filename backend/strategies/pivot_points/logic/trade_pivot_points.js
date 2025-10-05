/**
 * @file trade_pivot_points.js
 * @description This file contains the core logic for the pivot points trading strategy.
 * It establishes a WebSocket connection to Alpaca's real-time market data stream,
 * processes incoming bar data for a list of tickers, and checks for trading opportunities
 * based on pre-calculated pivot points stored in the database. It also includes a cron job
 * to close all open orders and positions at the end of the trading day.
 */

/**-----------------------------------------------------------------------------------------------------------------------
/*                                          IMPORTS
/*-----------------------------------------------------------------------------------------------------------------------*/

import { CronJob } from "cron";
import Alpaca from "@alpacahq/alpaca-trade-api";
import moment from "moment-timezone";
import websocket from "websocket";
import PivotPoints from "../../../database_models/db_model_pivot_points.js";
import { checkOportunities } from "./trade_utils.js";

/**-----------------------------------------------------------------------------------------------------------------------
/*                                          CONSTANTS
/*-----------------------------------------------------------------------------------------------------------------------*/

// Configuration options for the Alpaca API, loaded from environment variables.
const alpacaOptions = {
	keyId: process.env.ALPACA_KEY_ID,
	secretKey: process.env.ALPACA_SECRET_KEY,
	paper: true, // Use paper trading account
};

// WebSocket URL for Alpaca's IEX data stream.
const wssMarketDataURL = "wss://stream.data.alpaca.markets/v2/iex";

// Authentication object for the WebSocket connection.
const socketAuth = {
	action: "auth",
	key: process.env.ALPACA_KEY_ID,
	secret: process.env.ALPACA_SECRET_KEY,
};

/**-----------------------------------------------------------------------------------------------------------------------
/*                                          INITIALIZERS
/*-----------------------------------------------------------------------------------------------------------------------*/

// Instantiate the W3CWebSocket client.
const W3CWebSocket = websocket.w3cwebsocket;

// Instantiate the Alpaca API client with the specified options.
const alpaca = new Alpaca(alpacaOptions);

/**-----------------------------------------------------------------------------------------------------------------------
/*                                          LOGIC
/*-----------------------------------------------------------------------------------------------------------------------*/

/**
 * @function tradePivotPoints
 * @description Initializes and runs the pivot points trading strategy.
 * It connects to the Alpaca market data stream via WebSocket, listens for incoming bar data,
 * and triggers trading logic based on pivot points. It also schedules a cron job to clean up at the end of the day.
 * @param {string[]} tickers - An array of stock ticker symbols to trade (e.g., ["QQQ", "SPY"]).
 */
const tradePivotPoints = (tickers) => {
	console.log(`Starting day to Trade Pivot Points ----------------------------------${moment().tz('America/New_York').toString()}---------------------------------`);

	// Define the start and end times for the trading session in the 'America/New_York' timezone.
	const startTime = moment().tz("America/New_York").set({hour: 9, minute: 44, second: 0, millisecond: 0}); // Data for 9:44 AM arrives at 9:45 AM.
	const endTime = moment().tz("America/New_York").set({hour: 15, minute: 30, second: 0, millisecond: 0});

	// Establish a new WebSocket connection to the Alpaca data stream.
	const socketClient = new W3CWebSocket(wssMarketDataURL);

	// Set up the message handler for the WebSocket.
	socketClient.onmessage = async function (e) {
		const data = JSON.parse(e.data);
		const message = data[0].msg;
		const subscriptionMessage = { action: "subscribe", bars: tickers };

		// Step 1: Handle the initial connection success message.
		if (data[0].T === "success" && message === "connected") {
			// Once connected, send authentication credentials.
			socketClient.send(JSON.stringify(socketAuth));
		}

		// Step 2: Handle the authentication success message.
		else if (data[0].T === "success" && message === "authenticated") {
			// Once authenticated, subscribe to the real-time bar data for the specified tickers.
			socketClient.send(JSON.stringify(subscriptionMessage));
			console.log('Websocket authenticated & connected.')
		}

		// Step 3: Process incoming bar data.
		else if (data[0].T === "b") {
			// Find all pivot point data stored in the database.
			PivotPoints.find().then(async (ppData) => {
				// Iterate over each bar received in the WebSocket message.
				for (let i = 0; i < data.length; i++) {
					let currentBar = data[i];
					let currentMoment = moment(currentBar.t).tz("America/New_York");
					let barsHour = currentMoment.hour();
					let barsMinute = currentMoment.minute();

					// If the bar's timestamp is outside of trading hours, close the socket.
					if ((currentBar.t && currentMoment < startTime) || (currentBar.t && currentMoment > endTime)) {
						socketClient.close();	
						console.log("It's time to close the Strategy...")
						console.log("Current Moment: " + currentMoment.toString())
					}

					// --- CORE TRADING LOGIC ---
					// Find the pivot point data for the specific ticker of the current bar.
					let tickerPivotPointsData = ppData.find(
						(tickerPp) => tickerPp._id === currentBar.S
					);	
										
            		//console.log(currentBar)
					// Pass the current bar and its pivot points to the utility function to check for trading opportunities.
					await checkOportunities(currentBar, tickerPivotPointsData, barsHour, barsMinute);									
				}
			});
		}
	};

	// Set up the close handler for the WebSocket.
	socketClient.onclose = function () {
		console.log(`Pivot Points Trading has been Stopped -------------------------------${moment().tz('America/New_York').toString()}---------------------------------`);
	};

	// --- END-OF-DAY CLEANUP ---
	// Schedule a cron job to run every weekday at 3:58 PM New York time.
	var trade = new CronJob(
		"0 58 15 * * 1-5", // Cron pattern: at 15:58 on every day-of-week from 1 through 5.
		async function () {		
			// Cancel all open orders.
			alpaca.cancelAllOrders().then(res => {
				console.log(res)
				console.log("All pending orders have been cancelled.")

				// After a delay, close all open positions.
				setTimeout(() => {
					alpaca.closeAllPositions().then(response => {
						console.log(response)
						console.log("All positions have been closed.")
					});
				}, 10000) // 10-second delay to ensure cancellations are processed.
								
			})			
		},
		null,
		true,
		"America/New_York"
	);
};

/**-----------------------------------------------------------------------------------------------------------------------
/*                                          EXPORT
/*-----------------------------------------------------------------------------------------------------------------------*/
export default tradePivotPoints;