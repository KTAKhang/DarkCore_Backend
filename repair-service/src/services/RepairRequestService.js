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
		const { username, status, page = 1, limit = 5 } = searchParams;
		
		let query = {};
		
		if (status) {
			query.status = status;
		}

		// Build aggregation pipeline for pagination and search
		let pipeline = [
			{
				$lookup: {
					from: "users",
					localField: "user",
					foreignField: "_id",
					as: "user"
				}
			},
			{
				$lookup: {
					from: "repairservices",
					localField: "services",
					foreignField: "_id",
					as: "services"
				}
			},
			{
				$lookup: {
					from: "users",
					localField: "assignedTechnician",
					foreignField: "_id",
					as: "assignedTechnician"
				}
			},
			{
				$unwind: {
					path: "$user",
					preserveNullAndEmptyArrays: true
				}
			},
			{
				$unwind: {
					path: "$assignedTechnician",
					preserveNullAndEmptyArrays: true
				}
			}
		];

		// Add status filter
		if (status) {
			pipeline.push({
				$match: { status: status }
			});
		}

		// Add username search filter
		if (username) {
			pipeline.push({
				$match: {
					$or: [
						{ "user.user_name": { $regex: username, $options: "i" } },
						{ "user.email": { $regex: username, $options: "i" } }
					]
				}
			});
		}

		// Add sorting
		pipeline.push({
			$sort: { createdAt: -1 }
		});

		// Get total count for pagination
		const countPipeline = [...pipeline, { $count: "total" }];
		const totalResult = await RepairRequestModel.aggregate(countPipeline);
		const total = totalResult.length > 0 ? totalResult[0].total : 0;

		// Add pagination
		pipeline.push(
			{ $skip: (page - 1) * limit },
			{ $limit: parseInt(limit) }
		);

		const repairs = await RepairRequestModel.aggregate(pipeline);

		return {
			repairs,
			pagination: {
				page: parseInt(page),
				limit: parseInt(limit),
				total,
				totalPages: Math.ceil(total / limit)
			}
		};
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

	static async listAssignedTo(technicianId, query = {}) {
		const { page = 1, limit = 5 } = query;
		
		const repairs = await RepairRequestModel.find({ assignedTechnician: technicianId })
			.populate("user", "user_name email role_id")
			.populate("services")
			.populate("assignedTechnician", "user_name email role_id")
			.sort({ createdAt: -1 })
			.skip((page - 1) * limit)
			.limit(parseInt(limit));
			
		const total = await RepairRequestModel.countDocuments({ assignedTechnician: technicianId });
		
		return {
			repairs,
			pagination: {
				page: parseInt(page),
				limit: parseInt(limit),
				total,
				totalPages: Math.ceil(total / limit)
			}
		};
	}
}

module.exports = RepairRequestService;