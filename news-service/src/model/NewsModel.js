const mongoose = require("mongoose");

const newsSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
      unique: true,
    },
    excerpt: {
      type: String,
      trim: true,
    },
    content: {
      type: String,
      required: true,
    },
    author: {
      id: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
      name: { type: String, required: true },
    },
    tags: [
      {
        type: String,
        trim: true,
      },
    ],
    status: {
      type: String,
      enum: ["draft", "published", "archived"],
      default: "draft",
    },
    publishedAt: {
      type: Date,
    },
    views: {
      type: Number,
      default: 0,
    },
    image: { type: String, default: "", trim: true }, // URL ảnh
    imagePublicId: { type: String, default: "", trim: true }, // public_id Cloudinary
  },
  { timestamps: true }
);

// set publishedAt khi publish
newsSchema.pre("save", function (next) {
  if (this.status === "published" && !this.publishedAt) {
    this.publishedAt = new Date();
  }
  next();
});

// index để search và sort nhanh
newsSchema.index({
  title: "text",
  content: "text",
  excerpt: "text",
  "author.name": "text",
});
newsSchema.index({ publishedAt: -1 });

module.exports = mongoose.model("News", newsSchema);
