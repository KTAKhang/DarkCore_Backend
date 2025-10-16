const Discount = require("../models/discount.model");

const buildResponse = (res, status, message, data = null, httpCode = 200) => {
    return res.status(httpCode).json({ status, message, data });
};

const isDateRangeValid = (startDate, endDate) => {
    const start = new Date(startDate);
    const end = new Date(endDate);
    return start instanceof Date && !isNaN(start) && end instanceof Date && !isNaN(end) && start < end;
};

// BR1, BR2, BR3, BR4 enforced here
exports.createDiscount = async (req, res) => {
    try {
        const { code, discountPercent, minOrderValue = 0, maxDiscountAmount = null, startDate, endDate } = req.body;

        if (!code || !discountPercent || !startDate || !endDate) {
            return buildResponse(res, "ERR", "Thiếu các trường bắt buộc", null, 400);
        }

        if (!isDateRangeValid(startDate, endDate)) {
            return buildResponse(res, "ERR", "Khoảng thời gian không hợp lệ", null, 400);
        }

        const exists = await Discount.findOne({ code: code.toUpperCase() });
        if (exists) {
            return buildResponse(res, "ERR", "Mã giảm giá đã tồn tại", null, 409);
        }

        const discount = await Discount.create({
            code: code.toUpperCase(),
            discountPercent,
            minOrderValue,
            maxDiscountAmount,
            startDate,
            endDate,
            isActive: true
        });

        return buildResponse(res, "OK", "Tạo mã giảm giá thành công", discount, 201);
    } catch (error) {
        return buildResponse(res, "ERR", "Lỗi máy chủ nội bộ", null, 500);
    }
};

// Admin list all
exports.getAllDiscounts = async (_req, res) => {
    try {
        const discounts = await Discount.find({}).sort({ createdAt: -1 });
        return buildResponse(res, "OK", "Danh sách mã giảm giá", discounts);
    } catch (error) {
        return buildResponse(res, "ERR", "Lỗi máy chủ nội bộ", null, 500);
    }
};

// Get active discounts for users
exports.getActiveDiscounts = async (_req, res) => {
    try {
        const now = new Date();
        const discounts = await Discount.find({
            isActive: true,
            startDate: { $lte: now },
            endDate: { $gte: now }
        }).sort({ createdAt: -1 });
        
        return buildResponse(res, "OK", "Danh sách mã giảm giá đang hoạt động", discounts);
    } catch (error) {
        return buildResponse(res, "ERR", "Lỗi máy chủ nội bộ", null, 500);
    }
};

// Admin sees all; user only active
exports.getByCode = async (req, res) => {
    try {
        const { code } = req.params;
        if (!code) {
            return buildResponse(res, "ERR", "Mã là bắt buộc", null, 400);
        }
        const query = { code: code.toUpperCase() };
        let discount = await Discount.findOne(query);
        if (!discount) {
            return buildResponse(res, "ERR", "Không tìm thấy mã giảm giá", null, 404);
        }

        const roleName = req.user?.role_id?.name;
        if (roleName !== "admin") {
            const now = new Date();
            const isActiveWindow = discount.isActive && now >= discount.startDate && now <= discount.endDate;
            if (!isActiveWindow) {
                return buildResponse(res, "ERR", "Mã giảm giá không khả dụng", null, 404);
            }
        }

        return buildResponse(res, "OK", "Chi tiết mã giảm giá", discount);
    } catch (error) {
        return buildResponse(res, "ERR", "Lỗi máy chủ nội bộ", null, 500);
    }
};

// BR3: only update if not started yet OR already ended
exports.updateDiscount = async (req, res) => {
    try {
        const { id } = req.params;
        const update = { ...req.body };

        const discount = await Discount.findById(id);
        if (!discount) {
            return buildResponse(res, "ERR", "Không tìm thấy mã giảm giá", null, 404);
        }

        const now = new Date();
        const inUseWindow = now >= discount.startDate && now <= discount.endDate;
        if (inUseWindow) {
            return buildResponse(res, "ERR", "Không thể cập nhật mã giảm giá trong thời gian hoạt động", null, 400);
        }

        if ((update.startDate && update.endDate) && !isDateRangeValid(update.startDate, update.endDate)) {
            return buildResponse(res, "ERR", "Khoảng thời gian không hợp lệ", null, 400);
        }

        // BR2: prevent hard delete; handled in delete controller. Here we can allow toggle isActive.
        if (typeof update.isActive !== "undefined" && typeof update.isActive !== "boolean") {
            return buildResponse(res, "ERR", "isActive phải là boolean", null, 400);
        }

        if (update.code) {
            update.code = String(update.code).toUpperCase().trim();
            const dup = await Discount.findOne({ _id: { $ne: id }, code: update.code });
            if (dup) {
                return buildResponse(res, "ERR", "Mã giảm giá đã tồn tại", null, 409);
            }
        }

        const updated = await Discount.findByIdAndUpdate(id, update, { new: true });
        return buildResponse(res, "OK", "Cập nhật mã giảm giá thành công", updated);
    } catch (error) {
        return buildResponse(res, "ERR", "Lỗi máy chủ nội bộ", null, 500);
    }
};

// BR2: soft deactivate
exports.deactivateDiscount = async (req, res) => {
    try {
        const { id } = req.params;
        const discount = await Discount.findById(id);
        if (!discount) {
            return buildResponse(res, "ERR", "Không tìm thấy mã giảm giá", null, 404);
        }

        if (!discount.isActive) {
            return buildResponse(res, "OK", "Mã giảm giá đã được vô hiệu hóa", discount);
        }

        discount.isActive = false;
        await discount.save();
        return buildResponse(res, "OK", "Vô hiệu hóa mã giảm giá thành công", discount);
    } catch (error) {
        return buildResponse(res, "ERR", "Lỗi máy chủ nội bộ", null, 500);
    }
};

// BR5, BR6: apply discount for order total
exports.applyDiscount = async (req, res) => {
    try {
        const { code, orderTotal } = req.body;

        if (!code || typeof orderTotal !== "number") {
            return buildResponse(res, "ERR", "Mã và tổng đơn hàng số là bắt buộc", null, 400);
        }

        const discount = await Discount.findOne({ code: String(code).toUpperCase() });
        if (!discount) {
            return buildResponse(res, "ERR", "Không tìm thấy mã giảm giá", null, 404);
        }

        if (!discount.isActive) {
            return buildResponse(res, "ERR", "Mã giảm giá không hoạt động", null, 400);
        }

        const now = new Date();
        if (now < discount.startDate || now > discount.endDate) {
            return buildResponse(res, "ERR", "Mã giảm giá không trong thời gian hiệu lực", null, 400);
        }

        if (orderTotal < (discount.minOrderValue || 0)) {
            return buildResponse(res, "ERR", "Đơn hàng không đạt giá trị tối thiểu", null, 400);
        }

        const discountAmount = Math.floor(orderTotal * (discount.discountPercent / 100));
        
        // Áp dụng giới hạn số tiền giảm tối đa nếu có
        const finalDiscountAmount = discount.maxDiscountAmount 
            ? Math.min(discountAmount, discount.maxDiscountAmount)
            : discountAmount;
            
        const totalAfterDiscount = orderTotal - finalDiscountAmount;

        return buildResponse(res, "OK", "Áp dụng mã giảm giá thành công", {
            success: true,
            code: discount.code,
            discountPercent: discount.discountPercent,
            discountAmount: finalDiscountAmount, // Số tiền giảm thực tế (đã áp dụng giới hạn)
            originalDiscountAmount: discountAmount, // Số tiền giảm theo % (chưa áp dụng giới hạn)
            maxDiscountAmount: discount.maxDiscountAmount, // Giới hạn tối đa
            totalAfterDiscount
        });
    } catch (error) {
        return buildResponse(res, "ERR", "Lỗi máy chủ nội bộ", null, 500);
    }
};


