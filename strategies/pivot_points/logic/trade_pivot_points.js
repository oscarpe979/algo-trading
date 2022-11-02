/**-----------------------------------------------------------------------------------------------------------------------
/*                                          IMPORTS
/*-----------------------------------------------------------------------------------------------------------------------*/

import { CronJob } from "cron";
import moment from "moment-timezone";
import websocket from "websocket";

/**-----------------------------------------------------------------------------------------------------------------------
/*                                          INITIALIZERS
/*-----------------------------------------------------------------------------------------------------------------------*/
const auth = {
	action: "auth",
	key: process.env.ALPACA_KEY_ID,
	secret: process.env.ALPACA_SECRET_KEY,
};
const wssMarketDataURL = "wss://stream.data.alpaca.markets/v2/iex";
const W3CWebSocket = websocket.w3cwebsocket;

/**-----------------------------------------------------------------------------------------------------------------------
/*                                          LOGIC
/*-----------------------------------------------------------------------------------------------------------------------*/

const tradePivotPoints = (tickers) => {
	console.log("Starting to Trade Pivot Points");

	// Connects to Alpaca Streaming Socket
	const socketClient = new W3CWebSocket(wssMarketDataURL);

	// Listens to all messages
	socketClient.onmessage = async function (e) {
		const data = JSON.parse(e.data);
		const message = data[0].msg;
		const subscriptionMessage = { action: "subscribe", trades: tickers };

		// Verify Socket Connection
		if (message === "connected") {
			// Autenticate
			socketClient.send(JSON.stringify(auth));
		}

		// Verify Socket Authentication
		else if (message === "authenticated") {
			// Subscribe
			socketClient.send(JSON.stringify(subscriptionMessage));
		}

		// Getting Trades Data!
		else
			for (let trade of data) {
				let tradeHour = moment(trade.t).tz("America/New_York").hour();
				let tradeMinute = moment(trade.t).tz("America/New_York").minute();

				// Closes the socket @ 3:30pm EST Mon - Fri
				if (trade.t && tradeHour >= 15 && tradeMinute >= 30) {
					socketClient.close();
					console.log("Stopping Pivot Points Trading...");
				}

				// TRAAAAAAADDE----------------------------------------------------------------
				console.log(trade);
			}
	};
	
	// Sends message to the console confirming the socket has been closed.
	socketClient.onclose = function() {
		console.log('Pivot Points Trading has been Stopped.');
	};
};

/**-----------------------------------------------------------------------------------------------------------------------
/*                                          EXPORT
/*-----------------------------------------------------------------------------------------------------------------------*/
export default tradePivotPoints;
