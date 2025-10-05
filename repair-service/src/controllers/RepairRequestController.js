const RepairRequestService = require("../services/RepairRequestService");

class RepairRequestController {
	static async create(req, res) {
		try {
			const userId = req.user?._id || req.user?.id || req.body.user; // fallback for tests
			if (!userId) return res.status(401).json({ status: "ERR", message: "Unauthenticated" });
			const data = await RepairRequestService.createRequest(userId, req.body);
			return res.status(201).json({ status: "OK", data });
		} catch (err) {
			return res.status(400).json({ status: "ERR", message: err.message });
		}
	}

	static async update(req, res) {
		try {
			const userId = req.user?._id || req.user?.id;
			if (!userId) return res.status(401).json({ status: "ERR", message: "Unauthenticated" });
			const updated = await RepairRequestService.updateRequest(req.params.id, userId, req.body);
			if (updated === "FORBIDDEN") return res.status(403).json({ status: "ERR", message: "Not allowed" });
			if (!updated) return res.status(404).json({ status: "ERR", message: "Not found" });
			return res.status(200).json({ status: "OK", data: updated });
		} catch (err) {
			return res.status(400).json({ status: "ERR", message: err.message });
		}
	}

	static async cancel(req, res) {
		try {
			const userId = req.user?._id || req.user?.id;
			if (!userId) return res.status(401).json({ status: "ERR", message: "Unauthenticated" });
			const canceled = await RepairRequestService.cancelRequest(req.params.id, userId);
			if (canceled === "FORBIDDEN") return res.status(403).json({ status: "ERR", message: "Not allowed" });
			if (!canceled) return res.status(404).json({ status: "ERR", message: "Not found" });
			return res.status(200).json({ status: "OK", data: canceled });
		} catch (err) {
			return res.status(400).json({ status: "ERR", message: err.message });
		}
	}

	static async listAll(req, res) {
		try {
			const { username, status } = req.query;
			
			const searchParams = {};
			if (username && username.trim() !== '') searchParams.username = username.trim();
			if (status && status.trim() !== '') searchParams.status = status.trim();
			
			const data = await RepairRequestService.searchAndFilterRequests(searchParams);
			return res.status(200).json({ status: "OK", data });
		} catch (err) {
			return res.status(500).json({ status: "ERR", message: err.message });
		}
	}

	static async detail(req, res) {
		try {
			const item = await RepairRequestService.getById(req.params.id);
			if (!item) return res.status(404).json({ status: "ERR", message: "Not found" });
			return res.status(200).json({ status: "OK", data: item });
		} catch (err) {
			return res.status(400).json({ status: "ERR", message: err.message });
		}
	}

	static async listAssigned(req, res) {
		try {
			const technicianId = req.user?._id || req.user?.id;
			const data = await RepairRequestService.listAssignedTo(technicianId);
			return res.status(200).json({ status: "OK", data });
		} catch (err) {
			return res.status(500).json({ status: "ERR", message: err.message });
		}
	}

	static async assign(req, res) {
		try {
			const updated = await RepairRequestService.assignTechnician(req.params.id, req.body.technicianId);
			if (!updated) return res.status(404).json({ status: "ERR", message: "Not found" });
			return res.status(200).json({ status: "OK", data: updated });
		} catch (err) {
			return res.status(400).json({ status: "ERR", message: err.message });
		}
	}

	static async updateStatus(req, res) {
		try {
			const updated = await RepairRequestService.updateStatus(req.params.id, req.user?._id || req.user?.id, req.body.status);
			if (updated === "INVALID") return res.status(400).json({ status: "ERR", message: "Invalid status" });
			if (!updated) return res.status(404).json({ status: "ERR", message: "Not found" });
			return res.status(200).json({ status: "OK", data: updated });
		} catch (err) {
			return res.status(400).json({ status: "ERR", message: err.message });
		}
	}

	static async listMine(req, res) {
		try {
			const userId = req.user?._id || req.user?.id;
			if (!userId) return res.status(401).json({ status: "ERR", message: "Unauthenticated" });
			const data = await RepairRequestService.listMine(userId);
			return res.status(200).json({ status: "OK", data });
		} catch (err) {
			return res.status(500).json({ status: "ERR", message: err.message });
		}
	}
}

module.exports = RepairRequestController;


