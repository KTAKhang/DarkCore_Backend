const mongoose = require("mongoose");

const repairRequestSchema = new mongoose.Schema(
	{
		user: { type: mongoose.Schema.Types.ObjectId, ref: "users", required: true },
		services: [{ type: mongoose.Schema.Types.ObjectId, ref: "repair_services", required: true }],
		// Snapshot of service details at the time of request creation (to preserve pricing history)
		serviceSnapshots: [{
			serviceId: { type: mongoose.Schema.Types.ObjectId, ref: "repair_services" },
			serviceName: { type: String },
			servicePrice: { type: Number }
		}],
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
	{ 
		timestamps: true,
		toJSON: { virtuals: true },
		toObject: { virtuals: true }
	}
);

// Virtual field to get service details (prioritize snapshots for historical data)
repairRequestSchema.virtual('serviceDetails').get(function() {
	// If we have serviceSnapshots (new data), use them
	if (this.serviceSnapshots && this.serviceSnapshots.length > 0) {
		return this.serviceSnapshots.map(snapshot => ({
			_id: snapshot.serviceId,
			serviceName: snapshot.serviceName,
			basePrice: snapshot.servicePrice
		}));
	}
	// Otherwise, fall back to populated services (old data)
	return this.services;
});

const RepairRequestModel = mongoose.model("repair_requests", repairRequestSchema);
module.exports = RepairRequestModel;


