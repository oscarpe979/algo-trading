/**
 * @file get_bars.js
 * @description This file contains utility functions for fetching historical market data (bars) from the Alpaca API.
 * It provides functions to get the last available daily, weekly, and monthly bars for a given stock symbol.
 */

/**-----------------------------------------------------------------------------------------------------------------------
/*                                          IMPORTS
/*-----------------------------------------------------------------------------------------------------------------------*/
import moment from "moment-timezone";
import Alpaca from "@alpacahq/alpaca-trade-api";

/**-----------------------------------------------------------------------------------------------------------------------
/*                                          INITIALIZERS
/*-----------------------------------------------------------------------------------------------------------------------*/
// Instantiate the ALPACA API with configuration options from environment variables.
const options = {
	keyId: process.env.ALPACA_KEY_ID,
	secretKey: process.env.ALPACA_SECRET_KEY,
	paper: true, // Using paper trading account
};
const alpaca = new Alpaca(options);

/**-----------------------------------------------------------------------------------------------------------------------
/*                                          LOGIC
/*-----------------------------------------------------------------------------------------------------------------------*/

/**
 * @async
 * @function getLastDailyBar
 * @description Gets the last available daily bar for a given stock symbol.
 * It fetches the snapshot to determine the timestamp of the latest daily bar and then retrieves that bar.
 * For example, if today is Wednesday, it gets Tuesday's bar. If it's Monday, it gets Friday's bar.
 * @param {string} symbol - The stock ticker symbol (e.g., "QQQ").
 * @returns {Promise<object|undefined>} A promise that resolves to the last daily bar object, or undefined if not found. The bar object includes properties like Open, High, Low, Close, Volume, etc.
 */
export const getLastDailyBar = async (symbol) => {
	// Get the latest snapshot for the symbol to find the timestamp of the most recent daily bar.
	const snapshot = (await alpaca.getSnapshot(symbol))	
	// Alpaca SDK call to get the bar data.
	const bars = alpaca.getBarsV2(symbol, {
		start: snapshot.DailyBar.Timestamp,
		timeframe: alpaca.newTimeframe(1, alpaca.timeframeUnit.DAY),
		limit: 1,
	});

	// Asynchronously iterate over the bars generator and collect the results.
	const result = [];
	for await (let b of bars) {
		result.push(b);
	}
    
	return result[0];
};

/**
 * @async
 * @function getLastWeeklyBar
 * @description Gets the last available weekly bar for a given stock symbol.
 * It calculates the start of the previous week and fetches the corresponding weekly bar.
 * @param {string} symbol - The stock ticker symbol (e.g., "QQQ").
 * @returns {Promise<object|undefined>} A promise that resolves to the last weekly bar object, or undefined if not found.
 */
export const getLastWeeklyBar = async (symbol) => {
	// Calculate the start date of the previous week in the 'America/New_York' timezone.
	const lastWeek = moment().tz('America/New_York')
		.startOf("week")
		.subtract(1, "weeks")
		.format("YYYY-MM-DD");	

	// Alpaca SDK call to get the bar data.
	const bars = alpaca.getBarsV2(symbol, {
		start: lastWeek,
		timeframe: alpaca.newTimeframe(1, alpaca.timeframeUnit.WEEK),
		limit: 1,
	});

	// Asynchronously iterate over the bars generator and collect the results.
	const result = [];
	for await (let b of bars) {
		result.push(b);
	}

	return result[0];
};

/**
 * @async
 * @function getLastMonthlyBar
 * @description Gets the last available monthly bar for a given stock symbol.
 * It calculates the start of the previous month and fetches the corresponding monthly bar.
 * @param {string} symbol - The stock ticker symbol (e.g., "QQQ").
 * @returns {Promise<object|undefined>} A promise that resolves to the last monthly bar object, or undefined if not found.
 */
export const getLastMonthlyBar = async (symbol) => {
	// Calculate the start date of the previous month in the 'America/New_York' timezone.
	const lastMonth = moment().tz('America/New_York')
		.startOf("month")
		.subtract(1, "month")
		.format("YYYY-MM-DD");	

	// Alpaca SDK call to get the bar data.
	const bars = alpaca.getBarsV2(symbol, {
		start: lastMonth,
		timeframe: alpaca.newTimeframe(1, alpaca.timeframeUnit.MONTH),
		limit: 1,
	});

	// Asynchronously iterate over the bars generator and collect the results.
	const result = [];
	for await (let b of bars) {
		result.push(b);
	}

	return result[0];
};

/**-----------------------------------------------------------------------------------------------------------------------
/*                                          EXPORT
/*-----------------------------------------------------------------------------------------------------------------------*/

export default { getLastDailyBar, getLastWeeklyBar, getLastMonthlyBar };