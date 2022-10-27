/**-----------------------------------------------------------------------------------------------------------------------
/*                                          IMPORTS
/*-----------------------------------------------------------------------------------------------------------------------*/

import { CronJob } from "cron";
import Alpaca from "@alpacahq/alpaca-trade-api";
import { getLastDailyBar, getLastMonthlyBar, getLastWeeklyBar } from './logic/getBars.js';

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
/*                                          VARIABLES
/*-----------------------------------------------------------------------------------------------------------------------*/


// Pivot Points

/**-----------------------------------------------------------------------------------------------------------------------
/*                                          LOGIC
/*-----------------------------------------------------------------------------------------------------------------------*/

const pivotPointsStrategy = async () => {

	// Calculate Pivot Points every day @ 8:00 am EST
	const pivotPoints = () => {

	}
	//console.log(await getLastDailyBar('QQQ'));
	//console.log(await getLastWeeklyBar('QQQ'));
	console.log(await getLastMonthlyBar('QQQ'));
	var cronJob = new CronJob(
		"10 * * * * *",
		async function () {			
			console.log("Running Pivot Points Strategy");			
		},
		null,
		true,
		"America/Los_Angeles"
	);
};

/**-----------------------------------------------------------------------------------------------------------------------
/*                                          EXPORT
/*-----------------------------------------------------------------------------------------------------------------------*/

export default pivotPointsStrategy;
