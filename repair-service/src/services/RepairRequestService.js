const mongoose = require("mongoose");
const RepairRequestModel = require("../models/RepairRequestModel");
const RepairServiceModel = require("../models/RepairServiceModel");
require("../models/UserModel");

class RepairRequestService {
	static async calculateEstimatedCost(serviceIds) {
		const services = await RepairServiceModel.find({ _id: { $in: serviceIds } });
		return services.reduce((sum, s) => sum + (s.basePrice || 0), 0);
	}

	static async createRequest(userId, payload) {
		const { services, ...rest } = payload;
		const estimatedCost = await this.calculateEstimatedCost(services);
		return await RepairRequestModel.create({
			user: userId,
			services,
			estimatedCost,
			...rest,
		});
	}

	static async updateRequest(requestId, userId, payload) {
		const request = await RepairRequestModel.findById(requestId);
		if (!request) return null;
		if (request.status !== "waiting") return "FORBIDDEN";
		if (request.user.toString() !== userId.toString()) return "FORBIDDEN";

		if (payload.services) {
			payload.estimatedCost = await this.calculateEstimatedCost(payload.services);
		}
		return await RepairRequestModel.findByIdAndUpdate(requestId, payload, { new: true });
	}

	static async cancelRequest(requestId, userId) {
		const request = await RepairRequestModel.findById(requestId);
		if (!request) return null;
		if (request.status !== "waiting") return "FORBIDDEN";
		if (request.user.toString() !== userId.toString()) return "FORBIDDEN";
		request.status = "canceled";
		await request.save();
		return request;
	}

	static async listAllRequests(filter = {}) {
		return await RepairRequestModel.find(filter)
			.populate("user", "user_name email role_id")
			.populate("services")
			.populate("assignedTechnician", "user_name email role_id")
			.sort({ createdAt: -1 });
	}

	static async searchAndFilterRequests(searchParams = {}) {
		const { username, status } = searchParams;
		
		let query = {};
		
		if (status) {
			query.status = status;
		}

		let repairs = await RepairRequestModel.find(query)
			.populate("user", "user_name email role_id")
			.populate("services")
			.populate("assignedTechnician", "user_name email role_id")
			.sort({ createdAt: -1 });

		if (username) {
			repairs = repairs.filter(repair => {
				const user = repair.user;
				if (!user) return false;
				
				const userName = user.user_name || '';
				const userEmail = user.email || '';
				
				return userName.toLowerCase().includes(username.toLowerCase()) || 
					   userEmail.toLowerCase().includes(username.toLowerCase());
			});
		}

		return repairs;
	}

	static async getById(id) {
		return await RepairRequestModel.findById(id)
			.populate("user", "user_name email role_id")
			.populate("services")
			.populate("assignedTechnician", "user_name email role_id");
	}

	static async listMine(userId) {
		return await this.listAllRequests({ user: userId });
	}

	static async assignTechnician(requestId, technicianId) {
		const request = await RepairRequestModel.findById(requestId);
		if (!request) return null;
		request.assignedTechnician = technicianId;
		await request.save();
		return request;
		}

	static async updateStatus(requestId, actorId, nextStatus) {
		const request = await RepairRequestModel.findById(requestId);
		if (!request) return null;

		const validStatuses = ["waiting", "in-progress", "completed", "canceled"];
		if (!validStatuses.includes(nextStatus)) return "INVALID";

		request.status = nextStatus;
		await request.save();
		return request;
	}

	static async listAssignedTo(technicianId) {
		return await RepairRequestModel.find({ assignedTechnician: technicianId })
			.populate("user", "user_name email role_id")
			.populate("services")
			.populate("assignedTechnician", "user_name email role_id")
			.sort({ createdAt: -1 });
	}
}

module.exports = RepairRequestService;