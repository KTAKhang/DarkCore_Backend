const mongoose = require("mongoose");

const contactReplySchema = new mongoose.Schema(
  {
    contactId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Contact",
      required: true,
      index: true,
    },
    senderId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    senderRole: { type: String, enum: ["customer", "admin"], required: true },


    message: {
      type: String,
      required: true,
      minLength: 1,
      maxLength: 5000,
    },
    isInternal: {
      type: Boolean,
      default: false,
    },
    attachments: [
      {
        url: String,
        fileName: String,
        fileType: String,
        publicId: String,
      },
    ],
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("ContactReply", contactReplySchema);