/**-----------------------------------------------------------------------------------------------------------------------
/*                                          IMPORTS
/*-----------------------------------------------------------------------------------------------------------------------*/

import { CronJob } from "cron";
import updateAllPivotPoints from "./logic/update_all_pivot_points.js";
import tradePivotPoints from "./logic/trade_pivot_points.js";
import moment from 'moment';

/**-----------------------------------------------------------------------------------------------------------------------
/*                                          VARIABLES & CONSTANTS
/*-----------------------------------------------------------------------------------------------------------------------*/

const tickers = ["QQQ", "SPY", "XLE", "XLU",
				"JNJ", "UNH", "SBUX", "ABNB",
				"TSLA", "WMT", "NVDA", "MELI",
				"MA", "V", "DIS", "NFLX", "EA",
				"RTX", "XOM", "PG"];

/**-----------------------------------------------------------------------------------------------------------------------
/*                                          LOGIC
/*-----------------------------------------------------------------------------------------------------------------------*/

/**
 * @async
 * @function pivotPointsStrategy
 * @description This is the main function that orchestrates the pivot points trading strategy.
 * It performs two main tasks:
 * 1. Updates the pivot points for a predefined list of tickers on a daily basis.
 * 2. Schedules and executes the trading logic based on these pivot points.
 *
 * The trading logic is scheduled to run every weekday at 9:45 AM (New York time) via a cron job.
 * Additionally, if the server is started during trading hours on a weekday, it will immediately trigger the trading logic.
 */
const pivotPointsStrategy = async () => {
	// Immediately update the pivot points for all specified tickers upon strategy initialization.
	// This is set to run daily, but the initial call ensures data is fresh when the server starts.
	updateAllPivotPoints(tickers);

	// --- CRON JOB AND IMMEDIATE EXECUTION LOGIC ---
	// Get the current time to determine if the server has started within trading hours.
	const currentMoment = moment();
	const startTime = moment().set({hour: 9, minute: 45, second: 0, millisecond: 0});
	const endTime = moment().set({hour: 15, minute: 30, second: 0, millisecond: 0});
	console.log('Server started at: ' + moment().format('HH:mm'))

	// Schedule the trading logic to run every weekday (Monday to Friday) at 9:45 AM New York time.
	var trade = new CronJob(
		"0 45 9 * * 1-5", // Cron pattern: at 09:45 on every day-of-week from 1 through 5.
		async function () {		
			tradePivotPoints(tickers);			
		},
		null,
		true,
		"America/New_York"
	);

	// If the server starts during active trading hours on a weekday, run the trading logic immediately.
	if( (currentMoment >= startTime) && (currentMoment <= endTime) ){
		// Check if the current day is a weekday (Monday=1, Tuesday=2, ..., Friday=5).
		if( currentMoment.day() > 0 && currentMoment.day() < 6)
			tradePivotPoints(tickers);
	}		
};

/**-----------------------------------------------------------------------------------------------------------------------
/*                                          EXPORT
/*-----------------------------------------------------------------------------------------------------------------------*/

export default pivotPointsStrategy;
