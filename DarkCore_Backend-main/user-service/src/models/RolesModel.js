const mongoose = require("mongoose");

const roleSchema = new mongoose.Schema({
    name: String,
    description: String,
});

const RoleModel = mongoose.model("roles", roleSchema);
module.exports = RoleModel;
