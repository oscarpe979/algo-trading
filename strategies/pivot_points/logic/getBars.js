/**-----------------------------------------------------------------------------------------------------------------------
/*                                          IMPORTS
/*-----------------------------------------------------------------------------------------------------------------------*/
import moment from "moment";
import Alpaca from "@alpacahq/alpaca-trade-api";

/**-----------------------------------------------------------------------------------------------------------------------
/*                                          INITIALIZERS
/*-----------------------------------------------------------------------------------------------------------------------*/
// Instantiate the ALPACA API with configuration options
const options = {
	keyId: process.env.ALPACA_KEY_ID,
	secretKey: process.env.ALPACA_SECRET_KEY,
	paper: true,
};
const alpaca = new Alpaca(options);

/**-----------------------------------------------------------------------------------------------------------------------
/*                                          LOGIC
/*-----------------------------------------------------------------------------------------------------------------------*/

/**
 * Gets the last DAILY bar available. If it's Wednesday, it gets Tuesday's bar. If its Monday, it gets Fridays bar.
 * @param {*} symbol Ticker of which you need the last daily bar.
 * @returns Last DAILY bar available
 */
export const getLastDailyBar = async (symbol) => {
	const yesterday = moment()
		.startOf("day")
		.subtract(1, "days")
		.format("YYYY-MM-DD");

	// Alpaca SDK call
	const bars = alpaca.getBarsV2(symbol, {
		start: yesterday,
		timeframe: alpaca.newTimeframe(1, alpaca.timeframeUnit.DAY),
		limit: 1,
	});

	// Mapping the result
	const result = [];
	for await (let b of bars) {
		result.push(b);
	}
    
	return result[0];
};

/**
 * Gets the last WEEKLY bar available.
 * @param {*} symbol Ticker of which you need the last WEEKLY bar.
 * @returns Last WEEKLY bar available
 */
export const getLastWeeklyBar = async (symbol) => {
	const lastWeek = moment()
		.startOf("week")
		.subtract(1, "weeks")
		.format("YYYY-MM-DD");	

	// Alpaca SDK call
	const bars = alpaca.getBarsV2(symbol, {
		start: lastWeek,
		timeframe: alpaca.newTimeframe(1, alpaca.timeframeUnit.WEEK),
		limit: 1,
	});

	// Mapping the result
	const result = [];
	for await (let b of bars) {
		result.push(b);
	}

	return result[0];
};

/**
 * Gets the last MONTHLY bar available.
 * @param {*} symbol Ticker of which you need the last WEEKLY bar.
 * @returns Last MONTHLY bar available
 */
export const getLastMonthlyBar = async (symbol) => {
	const lastMonth = moment()
		.startOf("month")
		.subtract(1, "month")
		.format("YYYY-MM-DD");	

	// Alpaca SDK call
	const bars = alpaca.getBarsV2(symbol, {
		start: lastMonth,
		timeframe: alpaca.newTimeframe(1, alpaca.timeframeUnit.MONTH),
		limit: 1,
	});

	// Mapping the result
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
