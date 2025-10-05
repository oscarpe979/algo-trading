import mongoose from "mongoose";
const Schema = mongoose.Schema;

/**
 * @name PivotPointsSchema
 * @description Mongoose schema for storing pivot points data.
 * @type {mongoose.Schema}
 */
const PivotPointsSchema = new Schema({
	/**
	 * @property {string} _id - The unique identifier for the document.
	 */
	_id: {
		type: String,
		required: true,
	},

	/**
	 * @property {object} latestMinuteBar - The latest minute bar data.
	 */
	latestMinuteBar: {
		type: Object,
		required: true,
	},

	/**
	 * @property {object} pivotPoints - The calculated pivot points.
	 */
	pivotPoints: {
		type: Object,
		required: true,
	},

	/**
	 * @property {Date} dateCreated - The date the document was created.
	 */
	dateCreated: {
		type: Date,
		required: true,
	},

	/**
	 * @property {object} monitoring - Monitoring data.
	 */
	monitoring: {
		type: Object,
		required: true
	}
});

export default mongoose.model(
	"pivot points",
	PivotPointsSchema,
	"Pivot Points"
);
