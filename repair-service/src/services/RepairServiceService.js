const RepairServiceModel = require("../models/RepairServiceModel");

class RepairServiceService {
	static async createService(payload) {
		return await RepairServiceModel.create(payload);
	}

	static async listServices() {
		return await RepairServiceModel.find({}).sort({ createdAt: -1 });
	}

	static async updateService(id, payload) {
		return await RepairServiceModel.findByIdAndUpdate(id, payload, { new: true });
	}

	static async deleteService(id) {
		return await RepairServiceModel.findByIdAndDelete(id);
	}
}

module.exports = RepairServiceService;


