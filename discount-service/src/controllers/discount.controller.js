const DiscountService = require("../services/DiscountService");
// Admin create new discount
exports.createDiscount = async (req, res) => {
    const result = await DiscountService.createDiscount(req.body);
    return res.status(result.httpCode).json({ 
        status: result.status, 
        message: result.message, 
        data: result.data 
    });
};

// Admin list all 
exports.getAllDiscounts = async (req, res) => {
    const result = await DiscountService.getAllDiscountsWithPagination(req.query);
    return res.status(result.httpCode).json({ 
        status: result.status, 
        message: result.message, 
        data: result.data 
    });
};

// Admin list all 
exports.getAllDiscountsLegacy = async (_req, res) => {
    const result = await DiscountService.getAllDiscounts();
    return res.status(result.httpCode).json({ 
        status: result.status, 
        message: result.message, 
        data: result.data 
    });
};

// Get active discounts for users
exports.getActiveDiscounts = async (_req, res) => {
    const result = await DiscountService.getActiveDiscounts();
    return res.status(result.httpCode).json({ 
        status: result.status, 
        message: result.message, 
        data: result.data 
    });
};

// Admin sees all; user only see active
exports.getByCode = async (req, res) => {
    const { code } = req.params;
    const userRole = req.user?.role_id?.name;
    const result = await DiscountService.getDiscountByCode(code, userRole);
    return res.status(result.httpCode).json({ 
        status: result.status, 
        message: result.message, 
        data: result.data 
    });
};

// only update if not started yet OR already ended
exports.updateDiscount = async (req, res) => {
    const { id } = req.params;
    const result = await DiscountService.updateDiscount(id, req.body);
    return res.status(result.httpCode).json({ 
        status: result.status, 
        message: result.message, 
        data: result.data 
    });
};

//soft deactivate
exports.deactivateDiscount = async (req, res) => {
    const { id } = req.params;
    const result = await DiscountService.deactivateDiscount(id);
    return res.status(result.httpCode).json({ 
        status: result.status, 
        message: result.message, 
        data: result.data 
    });
};

// search discounts by code or date range
exports.searchDiscounts = async (req, res) => {
    const { keyword } = req.query;
    const result = await DiscountService.searchDiscounts(keyword, req.query);
    return res.status(result.httpCode).json({ 
        status: result.status, 
        message: result.message, 
        data: result.data 
    });
};

// BR5, BR6: apply discount for order total
exports.applyDiscount = async (req, res) => {
    const { code, orderTotal } = req.body;
    const result = await DiscountService.applyDiscount(code, orderTotal);
    return res.status(result.httpCode).json({ 
        status: result.status, 
        message: result.message, 
        data: result.data 
    });
};


