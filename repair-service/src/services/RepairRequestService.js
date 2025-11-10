const mongoose = require("mongoose");
const RepairRequestModel = require("../models/RepairRequestModel");
const RepairServiceModel = require("../models/RepairServiceModel");
const { sendRepairCompletionEmail } = require("./EmailService");
require("../models/UserModel");

class RepairRequestService {
	static async calculateEstimatedCost(serviceIds) {
		const services = await RepairServiceModel.find({ _id: { $in: serviceIds } });
		return services.reduce((sum, s) => sum + (s.basePrice || 0), 0);
	}

	// Snapshot service details to preserve pricing history
	static async snapshotServices(serviceIds) {
		const services = await RepairServiceModel.find({ _id: { $in: serviceIds } });
		return services.map(s => ({
			serviceId: s._id,
			serviceName: s.name, 
			servicePrice: s.basePrice || 0
		}));
	}

	static async createRequest(userId, payload) {
		const { services, ...rest } = payload;
		const estimatedCost = await this.calculateEstimatedCost(services);
		const serviceSnapshots = await this.snapshotServices(services);
		
		return await RepairRequestModel.create({
			user: userId,
			services,
			serviceSnapshots,
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
			payload.serviceSnapshots = await this.snapshotServices(payload.services);
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
		const requests = await RepairRequestModel.find(filter)
			.populate("user", "user_name email role_id")
			.populate("services") // Populate for old data
			.populate("assignedTechnician", "user_name email role_id")
			.sort({ createdAt: -1 });

		// Process each request to use snapshots if available (overwrite populated services)
		return requests.map(request => {
			const reqObj = request.toObject();
			
			// If we have serviceSnapshots (new data), use them instead
			if (reqObj.serviceSnapshots && reqObj.serviceSnapshots.length > 0) {
				reqObj.services = reqObj.serviceSnapshots.map(snapshot => ({
					_id: snapshot.serviceId,
					name: snapshot.serviceName, 
					serviceName: snapshot.serviceName,
					basePrice: snapshot.servicePrice
				}));
			}
			// Otherwise keep the populated services (for old data)
			
			return reqObj;
		});
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
					as: "servicesPopulated"
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
			},
			{
				// Add serviceDetails field that prioritizes snapshots over populated services
				$addFields: {
					services: {
						$cond: {
							if: { $and: [
								{ $isArray: "$serviceSnapshots" },
								{ $gt: [{ $size: "$serviceSnapshots" }, 0] }
							]},
							then: {
								$map: {
									input: "$serviceSnapshots",
									as: "snapshot",
									in: {
										_id: "$$snapshot.serviceId",
										serviceName: "$$snapshot.serviceName",
										basePrice: "$$snapshot.servicePrice"
									}
								}
							},
							else: "$servicesPopulated"
						}
					}
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
		const request = await RepairRequestModel.findById(id)
			.populate("user", "user_name email role_id")
			.populate("assignedTechnician", "user_name email role_id");

		if (!request) return null;

		// Convert to plain object to modify
		const requestObj = request.toObject();

		// If we have serviceSnapshots (new data), use them instead of populating
		if (requestObj.serviceSnapshots && requestObj.serviceSnapshots.length > 0) {
			requestObj.services = requestObj.serviceSnapshots.map(snapshot => ({
				_id: snapshot.serviceId,
				serviceName: snapshot.serviceName,
				name: snapshot.serviceName, // Add 'name' field too for compatibility
				basePrice: snapshot.servicePrice
			}));
		} else {
			// For old data without snapshots, populate services from database
			await request.populate("services");
			requestObj.services = request.services;
		}

		return requestObj;
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

	static async sendCompletionEmail(request) {
		try {
			// Populate user and services
			await request.populate("user");
			
			// Get service details (prefer snapshots)
			let services = [];
			if (request.serviceSnapshots && request.serviceSnapshots.length > 0) {
				services = request.serviceSnapshots.map(snapshot => ({
					name: snapshot.serviceName,
					serviceName: snapshot.serviceName,
					basePrice: snapshot.servicePrice
				}));
			} else {
				await request.populate("services");
				services = request.services;
			}
			
		// Send email
		await sendRepairCompletionEmail(request, request.user, services);
		} catch (error) {
			console.error('❌ Failed to send completion email:', error);
			// Don't throw - we don't want to fail the status update if email fails
		}
	}

	static async updateStatus(requestId, actorId, nextStatus) {
		const request = await RepairRequestModel.findById(requestId);
		if (!request) return null;

		// Lock status if already completed - cannot change
		if (request.status === "completed") {
			return "LOCKED";
		}

		const validStatuses = ["waiting", "in-progress", "completed", "canceled"];
		if (!validStatuses.includes(nextStatus)) return "INVALID";

		request.status = nextStatus;
		await request.save();
		
		// Send email notification if status changed to completed
		if (nextStatus === "completed") {
			await this.sendCompletionEmail(request);
		}
		
		return request;
	}

	static async listAssignedTo(technicianId, query = {}) {
		const { page = 1, limit = 5 } = query;
		
		const repairs = await RepairRequestModel.find({ assignedTechnician: technicianId })
			.populate("user", "user_name email role_id")
			.populate("services") // Populate for old data
			.populate("assignedTechnician", "user_name email role_id")
			.sort({ createdAt: -1 })
			.skip((page - 1) * limit)
			.limit(parseInt(limit));
			
		const total = await RepairRequestModel.countDocuments({ assignedTechnician: technicianId });
		
		// Process repairs to use snapshots if available
		const processedRepairs = repairs.map(repair => {
			const repairObj = repair.toObject();
			
			// If we have serviceSnapshots (new data), use them instead
			if (repairObj.serviceSnapshots && repairObj.serviceSnapshots.length > 0) {
				repairObj.services = repairObj.serviceSnapshots.map(snapshot => ({
					_id: snapshot.serviceId,
					name: snapshot.serviceName,
					serviceName: snapshot.serviceName,
					basePrice: snapshot.servicePrice
				}));
			}
			// Otherwise keep the populated services (for old data)
			
			return repairObj;
		});
		
		return {
			repairs: processedRepairs,
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