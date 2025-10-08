const mongoose = require("mongoose");

const repairServiceSchema = new mongoose.Schema(
	{
		name: { type: String, required: true, trim: true, unique: true },
		description: { type: String, default: "", trim: true },
		basePrice: { type: Number, required: true, min: 0 },
	},
	{ timestamps: true }
);

const RepairServiceModel = mongoose.model("repair_services", repairServiceSchema);
module.exports = RepairServiceModel;


