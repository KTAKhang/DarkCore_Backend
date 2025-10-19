const mongoose = require("mongoose");
require("./UserModel"); 
const contactSchema = new mongoose.Schema(
  {
    ticketId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    subject: {
      type: String,
      required: true,
      trim: true,
      maxLength: 100,
    },
    reason: {
      type: String,
      enum: ["Order", "Product", "Service", "Warranty", "Other"],
      required: true,
    },
    message: {
      type: String,
      required: true,
      minLength: 10,
      maxLength: 5000,
    },
    status: {
      type: String,
      enum: ["Pending", "In Progress", "Resolved", "Closed"],
      default: "Pending",
    },
    priority: {
      type: String,
      enum: ["Low", "Medium", "High"],
      default: "Medium",
    },
    attachments: [
      {
        url: String,
        fileName: String,
        fileType: String,
        publicId: String,
      },
    ],
    image: {
      type: String,
      default: null,
    },
    imagePublicId: {
      type: String,
      default: null,
    },
    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    isDeleted: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);
contactSchema.virtual('replies', {
  ref: 'ContactReply',
  localField: '_id',
  foreignField: 'contactId',
});
contactSchema.set('toObject', { virtuals: true });
contactSchema.set('toJSON', { virtuals: true });

module.exports = mongoose.model("Contact", contactSchema);