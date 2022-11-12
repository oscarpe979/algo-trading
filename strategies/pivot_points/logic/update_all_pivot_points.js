/**-----------------------------------------------------------------------------------------------------------------------
/*                                          IMPORTS
/*-----------------------------------------------------------------------------------------------------------------------*/

import getPivotPoints from "./get_pivot_points.js";
import PivotPoints from "../../../database_models/db_model_pivot_points.js";
import moment from "moment-timezone";
import { CronJob } from "cron";

/**-----------------------------------------------------------------------------------------------------------------------
/*                                          LOGIC             CronJob:  0 0/15 8 * * 1-5
/*-----------------------------------------------------------------------------------------------------------------------*/

const updateAllPivotPoints = async (tickers) => {    
	// Update Pivot Points every day Mon-Fri @ 8:00, 8:15, 8:30 and 8:45 am EST
	var updatePivotPoints = new CronJob(
		"0 0/15 8 * * 1-5",
		async function () {
			console.log("Updating Pivot Points");
			for await (let ticker of tickers) {
				let tickerPivotPoints = await getPivotPoints(ticker);

				PivotPoints.findOneAndUpdate(
					{ _id: ticker },
					{
						$set: {
							pivotPoints: tickerPivotPoints,
							monitoring: null,
							dateCreated: moment().tz('America/New_York'),
						},
					}
				).then((doc) => {
					if (doc) {
						console.log("Pivot Points Updated for " + ticker);
					} else {
						const newPivotPoints = new PivotPoints({
							_id: ticker,
							pivotPoints: tickerPivotPoints,
							monitoring: null,
							dateCreated: moment().tz('America/New_York'),							
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

/**-----------------------------------------------------------------------------------------------------------------------
/*                                          EXPORT
/*-----------------------------------------------------------------------------------------------------------------------*/
export default updateAllPivotPoints;