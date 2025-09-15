const mongoose = require("mongoose");

const SupportTicketSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: "users" },
  ticketId: { type: String, unique: true },
  typeService: { type: String, enum: ["technical", "payment", "delivery", "product"] },
  description: String,
  status: { type: String, enum: ["open", "in-progress", "resolved"], default: "open" },
  priority: { type: String, enum: ["normal", "high"], default: "normal" },
  assignedStaff: { type: mongoose.Schema.Types.ObjectId, ref: "users" },
  internalNotes: [String],
  history: [
    {
      update: String,
      by: { type: mongoose.Schema.Types.ObjectId, ref: "users" },
      date: Date,
    },
  ],
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

const SupportTicketModel = mongoose.model("supporttickets", SupportTicketSchema);
module.exports = SupportTicketModel;
