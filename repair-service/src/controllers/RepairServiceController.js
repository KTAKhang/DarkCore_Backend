const RepairServiceService = require("../services/RepairServiceService");

class RepairServiceController {
	static async create(req, res) {
		try {
			const data = await RepairServiceService.createService(req.body);
			return res.status(201).json({ status: "OK", data });
		} catch (err) {
			return res.status(400).json({ status: "ERR", message: err.message });
		}
	}

	static async list(req, res) {
		try {
			const { page, limit } = req.query;
			const query = {};
			if (page) query.page = parseInt(page);
			if (limit) query.limit = parseInt(limit);
			
			const result = await RepairServiceService.listServices(query);
			return res.status(200).json({ status: "OK", data: result });
		} catch (err) {
			return res.status(500).json({ status: "ERR", message: err.message });
		}
	}

	static async update(req, res) {
		try {
			const updated = await RepairServiceService.updateService(req.params.id, req.body);
			if (!updated) return res.status(404).json({ status: "ERR", message: "Not found" });
			return res.status(200).json({ status: "OK", data: updated });
		} catch (err) {
			return res.status(400).json({ status: "ERR", message: err.message });
		}
	}

	static async remove(req, res) {
		try {
			const deleted = await RepairServiceService.deleteService(req.params.id);
			if (!deleted) return res.status(404).json({ status: "ERR", message: "Not found" });
			return res.status(200).json({ status: "OK", data: deleted });
		} catch (err) {
			return res.status(400).json({ status: "ERR", message: err.message });
		}
	}
}

module.exports = RepairServiceController;


