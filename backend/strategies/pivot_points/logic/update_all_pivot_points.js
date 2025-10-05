/**
 * @file update_all_pivot_points.js
 * @description This file contains the logic for updating the pivot points for a list of stock tickers.
 * It uses a cron job to schedule the updates to run at specific times on weekdays before the market opens.
 */

/**-----------------------------------------------------------------------------------------------------------------------
/*                                          IMPORTS
/*-----------------------------------------------------------------------------------------------------------------------*/

import getPivotPoints from "./get_pivot_points.js";
import PivotPoints from "../../../database_models/db_model_pivot_points.js";
import moment from "moment-timezone";
import { CronJob } from "cron";

/**-----------------------------------------------------------------------------------------------------------------------
/*                                          LOGIC
/*-----------------------------------------------------------------------------------------------------------------------*/

/**
 * @async
 * @function updateAllPivotPoints
 * @description Schedules a cron job to update the pivot points for a given list of tickers.
 * The job runs every 15 minutes between 8:00 AM and 8:45 AM on weekdays (Monday to Friday), New York time.
 * For each ticker, it calculates the new pivot points and updates the corresponding document in the database.
 * If a document for a ticker does not exist, it creates a new one.
 * This process also resets the `latestMinuteBar` and `monitoring` fields for the new trading day.
 * @param {string[]} tickers - An array of stock ticker symbols to update (e.g., ["QQQ", "SPY"]).
 */
const updateAllPivotPoints = async (tickers) => {    
	// Schedule a cron job to update pivot points every weekday morning before market open.
	// The pattern "0 0/15 8 * * 1-5" means: at minute 0, 15, 30, and 45 past hour 8 on every day-of-week from 1 through 5.
	var updatePivotPoints = new CronJob(
		"0 0/15 8 * * 1-5",
		async function () {
			console.log("Updating Pivot Points...");
			// Iterate over each ticker in the provided list.
			for await (let ticker of tickers) {
				// Calculate the latest pivot points for the current ticker.
				let tickerPivotPoints = await getPivotPoints(ticker);

				// Find the corresponding document in the database and update it.
				// The 'upsert' functionality is handled manually by checking if a document is returned from the findOneAndUpdate call.
				PivotPoints.findOneAndUpdate(
					{ _id: ticker }, // The filter to find the document by its ticker symbol (_id).
					{
						$set: {
							latestMinuteBar: null, // Reset the latest bar for the new day.
							pivotPoints: tickerPivotPoints, // Set the newly calculated pivot points.
							monitoring: null, // Reset the monitoring object for the new day.
							dateCreated: moment().tz('America/New_York'), // Update the timestamp.
						},
					}
				).then((doc) => {
					// If a document was found and updated, 'doc' will contain the document *before* the update.
					if (doc) {
						//console.log("Pivot Points Updated for " + ticker);
					}
					// If no document was found, 'doc' will be null, so we create a new one.
					else {
						const newPivotPoints = new PivotPoints({
							_id: ticker,
							latestMinuteBar: null,
							pivotPoints: tickerPivotPoints,
							monitoring: null,
							dateCreated: moment().tz('America/New_York'),							
						});
						// Save the new document to the database.
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
		null, // onComplete
		true, // start
		"America/New_York" // timeZone
	);
};

/**-----------------------------------------------------------------------------------------------------------------------
/*                                          EXPORT
/*-----------------------------------------------------------------------------------------------------------------------*/
export default updateAllPivotPoints;