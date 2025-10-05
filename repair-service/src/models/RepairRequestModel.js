const mongoose = require("mongoose");

const repairRequestSchema = new mongoose.Schema(
	{
		user: { type: mongoose.Schema.Types.ObjectId, ref: "users", required: true },
		services: [{ type: mongoose.Schema.Types.ObjectId, ref: "repair_services", required: true }],
		deviceName: { type: String, required: true, trim: true },
		deviceBrand: { type: String, required: true, trim: true },
		deviceModel: { type: String, required: true, trim: true },
		serialNumber: { type: String, default: "", trim: true },
		description: { type: String, required: true, trim: true },
		status: {
			type: String,
			enum: ["waiting", "in-progress", "completed", "canceled"],
			default: "waiting",
		},
		appointmentDate: { type: Date, required: true },
		assignedTechnician: { type: mongoose.Schema.Types.ObjectId, ref: "users", default: null },
		estimatedCost: { type: Number, required: true, min: 0 },
		approvalStatus: { type: String, enum: ["pending", "approved", "rejected"], default: "pending" },
	},
	{ timestamps: true }
);

const RepairRequestModel = mongoose.model("repair_requests", repairRequestSchema);
module.exports = RepairRequestModel;


