/**-----------------------------------------------------------------------------------------------------------------------
/*                                          IMPORTS
/*-----------------------------------------------------------------------------------------------------------------------*/

import { CronJob } from "cron";
import Alpaca from "@alpacahq/alpaca-trade-api";
import moment from "moment";

import getPivotPoints from "./logic/getPivotPoints.js";
import PivotPoints from "../../database_models/db_model_pivot_points.js";

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

const tickers = ["QQQ", "DIA", 'SPY'];

/**-----------------------------------------------------------------------------------------------------------------------
/*                                          LOGIC                 0 * 8 * * 1-5
/*-----------------------------------------------------------------------------------------------------------------------*/

const updateAllPivotPoints = async () => {
	// Update Pivot Points every day Mon-Fri @ 8:00 am EST
	var updatePivotPoints = new CronJob(
		"0 0 8 * * 1-5",
		async function () {
			console.log("Updating Pivot Points");
			for await (let ticker of tickers) {
				let tickerPivotPoints = await getPivotPoints(ticker);

				PivotPoints.findOneAndUpdate(
					{ _id: ticker },
					{
						$set: {
							pivotPoints: tickerPivotPoints,
							dateCreated: moment(),
						},
					}
				).then((doc) => {
					if (doc) {
						console.log("Pivot Points Updated for " + ticker);
					} else {
						const newPivotPoints = new PivotPoints({
							_id: ticker,
							pivotPoints: tickerPivotPoints,
							dateCreated: moment(),
						});
						newPivotPoints
							.save()
							.then(console.log("Pivot Points Updated for " + ticker))
							.catch((err) =>
								console.log(
									"Error updating Pivot Points for " + ticker + ": " + err
								)
							);
					}
				});
			}
		},
		null,
		true,
		"America/New_York"
	);
};

const pivotPointsStrategy = async () => {
	// Update All Pivot Points on a daily basis Mon-Fri @ 8:00 am EST
	updateAllPivotPoints();
};

/**-----------------------------------------------------------------------------------------------------------------------
/*                                          EXPORT
/*-----------------------------------------------------------------------------------------------------------------------*/

export default pivotPointsStrategy;
