/**-----------------------------------------------------------------------------------------------------------------------
/*                                          IMPORTS
/*-----------------------------------------------------------------------------------------------------------------------*/

import { CronJob } from "cron";
import updateAllPivotPoints from "./logic/update_all_pivot_points.js";
import tradePivotPoints from "./logic/trade_pivot_points.js";

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

	// Start trading Pivot Points - CronJob: "0 30 9 * * 1-5"
	var trade = new CronJob(
		"0 45 9 * * 1-5",
		async function () {		
			tradePivotPoints(tickers);			
		},
		null,
		true,
		"America/New_York"
	);	

	//tradePivotPoints(tickers);	
};

/**-----------------------------------------------------------------------------------------------------------------------
/*                                          EXPORT
/*-----------------------------------------------------------------------------------------------------------------------*/

export default pivotPointsStrategy;
