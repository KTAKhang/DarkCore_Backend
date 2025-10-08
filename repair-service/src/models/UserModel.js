const mongoose = require("mongoose");


const userSchema = new mongoose.Schema(
	{
		user_name: { type: String },
		email: { type: String },
		role_id: { type: mongoose.Schema.Types.ObjectId, ref: "roles" },
	},
	{ timestamps: false, strict: false }
);

// Register model name 'users' to match references in other services
module.exports = mongoose.models.users || mongoose.model("users", userSchema);


