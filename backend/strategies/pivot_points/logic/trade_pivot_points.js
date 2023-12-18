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

const alpacaOptions = {
	keyId: process.env.ALPACA_KEY_ID,
	secretKey: process.env.ALPACA_SECRET_KEY,
	paper: true,
};
const wssMarketDataURL = "wss://stream.data.alpaca.markets/v2/iex";
const socketAuth = {
	action: "auth",
	key: process.env.ALPACA_KEY_ID,
	secret: process.env.ALPACA_SECRET_KEY,
};

/**-----------------------------------------------------------------------------------------------------------------------
/*                                          INITIALIZERS
/*-----------------------------------------------------------------------------------------------------------------------*/

// Instantiate the W3CWebSocket withguration options
const W3CWebSocket = websocket.w3cwebsocket;

// Instantiate the ALPACA API with configuration options
const alpaca = new Alpaca(alpacaOptions);

/**-----------------------------------------------------------------------------------------------------------------------
/*                                          LOGIC
/*-----------------------------------------------------------------------------------------------------------------------*/

const tradePivotPoints = (tickers) => {
	console.log(`Starting day to Trade Pivot Points ----------------------------------${moment().tz('America/New_York').toString()}---------------------------------`);

	// This are the allowed end and start times for this trading day
	const startTime = moment().tz("America/New_York").set({hour: 9, minute: 44, second: 0, millisecond: 0}); // Because at 9:45am we get 9:44am data.
	const endTime = moment().tz("America/New_York").set({hour: 15, minute: 30, second: 0, millisecond: 0});

	// Connects to Alpaca Streaming Socket
	const socketClient = new W3CWebSocket(wssMarketDataURL);

	// Listens to all messages
	socketClient.onmessage = async function (e) {
		const data = JSON.parse(e.data);
		const message = data[0].msg;
		const subscriptionMessage = { action: "subscribe", bars: tickers };

		// Verify Socket Connection
		if (data[0].T === "success" && message === "connected") {
			// Autenticate
			socketClient.send(JSON.stringify(socketAuth));
		}

		// Verify Socket Authentication
		else if (data[0].T === "success" && message === "authenticated") {
			// Subscribe
			socketClient.send(JSON.stringify(subscriptionMessage));
			console.log('Websocket authenticated & connected.')
		}

		// Getting Trades Data!
		else if (data[0].T === "b") {
			// Find Pivot Points Info
			PivotPoints.find().then(async (ppData) => {
				//Iterate over socket Data Points
				for (let i = 0; i < data.length; i++) {
					let currentBar = data[i];
					let currentMoment = moment(currentBar.t).tz("America/New_York");
					let barsHour = currentMoment.hour();
					let barsMinute = currentMoment.minute();

					// Closes the socket @ 3:30pm EST Mon - Fri until 9:45 am the next day.
					if ((currentBar.t && currentMoment < startTime) || (currentBar.t && currentMoment > endTime)) {
						socketClient.close();	
						console.log("It's time to close the Strategy...")
						console.log("Current Moment: " + currentMoment.toString())
					}

					// TRAAAAAAADDE----------------------------------------------------------------
					// Get all Pivot Points
					let tickerPivotPointsData = ppData.find(
						(tickerPp) => tickerPp._id === currentBar.S
					);	
										
            		//console.log(currentBar)
					// Constantly checks if there's a Oportunities and executes them.					
					await checkOportunities(currentBar, tickerPivotPointsData, barsHour, barsMinute);									
				}
			});
		}
	};

	// Sends message to the console confirming the socket has been closed.
	socketClient.onclose = function () {
		console.log(`Pivot Points Trading has been Stopped -------------------------------${moment().tz('America/New_York').toString()}---------------------------------`);
	};

	// Closes any existing orders @ 3:58pm 
	var trade = new CronJob(
		"0 58 15 * * 1-5",
		async function () {		
			alpaca.cancelAllOrders().then(res => {
				console.log(res)
				console.log("All pending orders have been cancelled.")

				setTimeout(() => {
					alpaca.closeAllPositions().then(response => {
						console.log(response)
						console.log("All positions have been closed.")
					});
				}, 10000)
								
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
