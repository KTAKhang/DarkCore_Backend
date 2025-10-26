const RepairServiceModel = require("../models/RepairServiceModel");

class RepairServiceService {
	static async createService(payload) {
		return await RepairServiceModel.create(payload);
	}

	static async listServices(query = {}) {
		const { page = 1, limit = 5 } = query;
		
		const services = await RepairServiceModel.find({})
			.sort({ createdAt: -1 })
			.skip((page - 1) * limit)
			.limit(parseInt(limit));
			
		const total = await RepairServiceModel.countDocuments({});
		
		return {
			services,
			pagination: {
				page: parseInt(page),
				limit: parseInt(limit),
				total,
				totalPages: Math.ceil(total / limit)
			}
		};
	}

	static async updateService(id, payload) {
		return await RepairServiceModel.findByIdAndUpdate(id, payload, { new: true });
	}

	static async deleteService(id) {
		return await RepairServiceModel.findByIdAndDelete(id);
	}
}

module.exports = RepairServiceService;


