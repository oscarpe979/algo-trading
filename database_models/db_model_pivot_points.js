import mongoose from "mongoose";
const Schema = mongoose.Schema;

const PivotPointsSchema = new Schema({
	_id: {
		type: String,
		required: true,
	},

	latestMinuteBar: {
		type: Object,
		required: true,
	},

	pivotPoints: {
		type: Object,
		required: true,
	},

	dateCreated: {
		type: Date,
		required: true,
	},

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
