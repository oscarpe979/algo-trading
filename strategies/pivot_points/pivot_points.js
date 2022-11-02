/**-----------------------------------------------------------------------------------------------------------------------
/*                                          IMPORTS
/*-----------------------------------------------------------------------------------------------------------------------*/

import { CronJob } from "cron";
import Alpaca from "@alpacahq/alpaca-trade-api";
import moment from "moment-timezone";

import updateAllPivotPoints from "./logic/update_all_pivot_points.js";
import tradePivotPoints from "./logic/trade_pivot_points.js";

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
/*                                          VARIABLES & CONSTANTS
/*-----------------------------------------------------------------------------------------------------------------------*/

const tickers = ["QQQ", "DIA", "SPY"];

/**-----------------------------------------------------------------------------------------------------------------------
/*                                          LOGIC
/*-----------------------------------------------------------------------------------------------------------------------*/

const pivotPointsStrategy = async () => {
	// Update All Pivot Points on a daily basis Mon-Fri @ 8:00 am EST
	updateAllPivotPoints(tickers);

	// Start trading Pivot Points
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
