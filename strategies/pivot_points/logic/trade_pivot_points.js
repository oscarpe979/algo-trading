/**-----------------------------------------------------------------------------------------------------------------------
/*                                          IMPORTS
/*-----------------------------------------------------------------------------------------------------------------------*/

import { CronJob } from "cron";
import moment from "moment-timezone";
import websocket from "websocket";
import PivotPoints from "../../../database_models/db_model_pivot_points.js";
import { checkOportunities } from "./trade_utils.js";

/**-----------------------------------------------------------------------------------------------------------------------
/*                                          CONSTANTS
/*-----------------------------------------------------------------------------------------------------------------------*/

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

/**-----------------------------------------------------------------------------------------------------------------------
/*                                          LOGIC
/*-----------------------------------------------------------------------------------------------------------------------*/

const tradePivotPoints = (tickers) => {
	console.log(`Starting day to Trade Pivot Points ----------------------------------${moment().tz('America/New_York').toString()}---------------------------------`);

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
		}

		// Getting Trades Data!
		else if (data[0].T === "b") {
			// Find Pivot Points Info
			PivotPoints.find().then((ppData) => {
				//Iterate over socket Data Points
				for (let currentBar of data) {
					let barsHour = moment(currentBar.t).tz("America/New_York").hour();
					let barsMinute = moment(currentBar.t).tz("America/New_York").minute();

					// Closes the socket @ 3:30pm EST Mon - Fri
					if (currentBar.t && barsHour >= 15 && barsMinute >= 30) {
						socketClient.close();						
						break;
					}

					// TRAAAAAAADDE----------------------------------------------------------------
					// Get all Pivot Points
					let tickerPivotPointsData = ppData.find(
						(tickerPp) => tickerPp._id === currentBar.S
					);					
					
					// Constantly checks if there's a Crossover					
					checkOportunities(currentBar, tickerPivotPointsData);						
				}
			});
		}
	};

	// Sends message to the console confirming the socket has been closed.
	socketClient.onclose = function () {
		console.log(`Pivot Points Trading has been Stopped -------------------------------${moment().tz('America/New_York').toString()}---------------------------------`);
	};
};

/**-----------------------------------------------------------------------------------------------------------------------
/*                                          EXPORT
/*-----------------------------------------------------------------------------------------------------------------------*/
export default tradePivotPoints;
