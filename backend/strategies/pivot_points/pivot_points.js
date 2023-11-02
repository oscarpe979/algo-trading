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

const pivotPointsStrategy = async () => {
	// Update All Pivot Points on a daily basis Mon-Fri @ 8:00 am EST
	updateAllPivotPoints(tickers);

	// Time at which the server starts
	const hourStarted = moment().hours();
	const minuteStarted = moment().minutes();
	const dayStarted = moment().day()
	console.log('Server started at: ' + moment().format('HH:mm'))

	//  trading Pivot Points - CronJob: "0 45 9 * * 1-5"
	var trade = new CronJob(
		"0 45 9 * * 1-5",
		async function () {		
			tradePivotPoints(tickers);			
		},
		null,
		true,
		"America/New_York"
	);

	// Run as soon as the server starts if it's trading time
	if( (hourStarted >= 9 && minuteStarted >= 45) || (hourStarted <= 15 && minuteStarted >= 30) ){
		//Checks if its a business day of the week
		if( dayStarted > 0 && dayStarted < 6)
			tradePivotPoints(tickers);
	}		
};

/**-----------------------------------------------------------------------------------------------------------------------
/*                                          EXPORT
/*-----------------------------------------------------------------------------------------------------------------------*/

export default pivotPointsStrategy;
