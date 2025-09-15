const mongoose = require("mongoose");

const RepairRequestSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: "users" },
  product: { type: mongoose.Schema.Types.ObjectId, ref: "products" },
  description: String,
  status: { type: String, enum: ["waiting", "in-progress", "completed", "canceled"], default: "waiting" },
  appointmentDate: Date,
  assignedTechnician: { type: mongoose.Schema.Types.ObjectId, ref: "users" },
  estimatedCost: Number,
  customerApproval: Boolean,
  progressUpdates: [
    {
      note: String,
      date: Date,
    },
  ],
  beforeAfterImages: [String],
  warrantyChecked: Boolean,
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

const RepairRequestModel = mongoose.model("repairrequests", RepairRequestSchema);
module.exports = RepairRequestModel;
