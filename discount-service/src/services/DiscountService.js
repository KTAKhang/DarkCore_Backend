const Discount = require("../models/discount.model");

class DiscountService {
    // Helper method để validate date range
    static isDateRangeValid(startDate, endDate) {
        const start = new Date(startDate);
        const end = new Date(endDate);
        return start instanceof Date && !isNaN(start) && end instanceof Date && !isNaN(end) && start < end;
    }

    // Helper method để build response
    static buildResponse(status, message, data = null, httpCode = 200) {
        return { status, message, data, httpCode };
    }

    // Tạo mã giảm giá mới
    static async createDiscount(discountData) {
        try {
            const { code, discountPercent, minOrderValue = 0, maxDiscountAmount = null, startDate, endDate } = discountData;

            // Validate required fields
            if (!code || !discountPercent || !startDate || !endDate) {
                return this.buildResponse("ERR", "Thiếu các trường bắt buộc", null, 400);
            }

            // Validate date range
            if (!this.isDateRangeValid(startDate, endDate)) {
                return this.buildResponse("ERR", "Khoảng thời gian không hợp lệ", null, 400);
            }

            // Check if code already exists
            const exists = await Discount.findOne({ code: code.toUpperCase() });
            if (exists) {
                return this.buildResponse("ERR", "Mã giảm giá đã tồn tại", null, 409);
            }

            // Create new discount
            const discount = await Discount.create({
                code: code.toUpperCase(),
                discountPercent,
                minOrderValue,
                maxDiscountAmount,
                startDate,
                endDate,
                isActive: true
            });

            return this.buildResponse("OK", "Tạo mã giảm giá thành công", discount, 201);
        } catch (error) {
            return this.buildResponse("ERR", "Lỗi máy chủ nội bộ", null, 500);
        }
    }

    // Lấy tất cả mã giảm giá (cho admin) - với phân trang, sort và filter
    static async getAllDiscountsWithPagination(query = {}) {
        try {
            const { page = 1, limit = 10, sortBy = 'createdAt', sortOrder = 'desc', code, isActive, status } = query;
            
            // Build filter object
            const filter = {};
            
            // Filter by code (partial match)
            if (code && code.trim()) {
                filter.code = { $regex: code.trim(), $options: 'i' };
            }
            
            // Filter by isActive status
            if (isActive !== undefined) {
                filter.isActive = isActive === 'true' || isActive === true;
            }
            
            // Filter by status (active/inactive based on date range)
            if (status && status !== 'all') {
                const now = new Date();
                if (status === 'active') {
                    filter.isActive = true;
                    filter.startDate = { $lte: now };
                    filter.endDate = { $gte: now };
                } else if (status === 'expired') {
                    filter.endDate = { $lt: now };
                } else if (status === 'upcoming') {
                    filter.startDate = { $gt: now };
                } else if (status === 'inactive') {
                    filter.isActive = false;
                }
            }
            
            // Build sort object
            let sortOption = { createdAt: -1 }; // default
            const sortField = sortBy.toString().trim().toLowerCase();
            const order = sortOrder.toString().trim().toLowerCase() === 'asc' ? 1 : -1;
            
            switch (sortField) {
                case 'code':
                    sortOption = { code: order };
                    break;
                case 'discountpercent':
                case 'discount_percent':
                    sortOption = { discountPercent: order };
                    break;
                case 'minordervalue':
                case 'min_order_value':
                    sortOption = { minOrderValue: order };
                    break;
                case 'maxdiscountamount':
                case 'max_discount_amount':
                    sortOption = { maxDiscountAmount: order };
                    break;
                case 'startdate':
                case 'start_date':
                    sortOption = { startDate: order };
                    break;
                case 'enddate':
                case 'end_date':
                    sortOption = { endDate: order };
                    break;
                case 'createdat':
                case 'created_at':
                case 'created':
                    sortOption = { createdAt: order };
                    break;
                case 'updatedat':
                case 'updated_at':
                case 'updated':
                    sortOption = { updatedAt: order };
                    break;
                default:
                    sortOption = { createdAt: -1 };
            }
            
            // Execute query with pagination
            const discounts = await Discount.find(filter)
                .sort(sortOption)
                .skip((page - 1) * limit)
                .limit(Number(limit))
                .lean();
                
            const total = await Discount.countDocuments(filter);
            
            return this.buildResponse("OK", "Danh sách mã giảm giá", {
                discounts,
                pagination: {
                    page: Number(page),
                    limit: Number(limit),
                    total,
                    totalPages: Math.ceil(total / limit)
                }
            });
        } catch (error) {
            return this.buildResponse("ERR", "Lỗi máy chủ nội bộ", null, 500);
        }
    }

    // Lấy tất cả mã giảm giá (cho admin) - method cũ để backward compatibility
    static async getAllDiscounts() {
        try {
            const discounts = await Discount.find({}).sort({ createdAt: -1 });
            return this.buildResponse("OK", "Danh sách mã giảm giá", discounts);
        } catch (error) {
            return this.buildResponse("ERR", "Lỗi máy chủ nội bộ", null, 500);
        }
    }

    // Lấy mã giảm giá đang hoạt động (cho user)
    static async getActiveDiscounts() {
        try {
            const now = new Date();
            const discounts = await Discount.find({
                isActive: true,
                startDate: { $lte: now },
                endDate: { $gte: now }
            }).sort({ createdAt: -1 });
            
            return this.buildResponse("OK", "Danh sách mã giảm giá đang hoạt động", discounts);
        } catch (error) {
            return this.buildResponse("ERR", "Lỗi máy chủ nội bộ", null, 500);
        }
    }

    // Lấy mã giảm giá theo code
    static async getDiscountByCode(code, userRole) {
        try {
            if (!code) {
                return this.buildResponse("ERR", "Mã là bắt buộc", null, 400);
            }

            const query = { code: code.toUpperCase() };
            let discount = await Discount.findOne(query);
            
            if (!discount) {
                return this.buildResponse("ERR", "Không tìm thấy mã giảm giá", null, 404);
            }

            // Nếu không phải admin, chỉ cho xem mã đang hoạt động
            if (userRole !== "admin") {
                const now = new Date();
                const isActiveWindow = discount.isActive && now >= discount.startDate && now <= discount.endDate;
                if (!isActiveWindow) {
                    return this.buildResponse("ERR", "Mã giảm giá không khả dụng", null, 404);
                }
            }

            return this.buildResponse("OK", "Chi tiết mã giảm giá", discount);
        } catch (error) {
            return this.buildResponse("ERR", "Lỗi máy chủ nội bộ", null, 500);
        }
    }

    // Cập nhật mã giảm giá
    static async updateDiscount(id, updateData) {
        try {
            const discount = await Discount.findById(id);
            if (!discount) {
                return this.buildResponse("ERR", "Không tìm thấy mã giảm giá", null, 404);
            }

            const now = new Date();
            const inUseWindow = now >= discount.startDate && now <= discount.endDate;
            if (inUseWindow) {
                return this.buildResponse("ERR", "Không thể cập nhật mã giảm giá trong thời gian hoạt động", null, 400);
            }

            // Validate date range if provided
            if ((updateData.startDate && updateData.endDate) && !this.isDateRangeValid(updateData.startDate, updateData.endDate)) {
                return this.buildResponse("ERR", "Khoảng thời gian không hợp lệ", null, 400);
            }

            // Validate isActive field
            if (typeof updateData.isActive !== "undefined" && typeof updateData.isActive !== "boolean") {
                return this.buildResponse("ERR", "trường hoạt động phải là boolean", null, 400);
            }

            // Check for duplicate code
            if (updateData.code) {
                updateData.code = String(updateData.code).toUpperCase().trim();
                const dup = await Discount.findOne({ _id: { $ne: id }, code: updateData.code });
                if (dup) {
                    return this.buildResponse("ERR", "Mã giảm giá đã tồn tại", null, 409);
                }
            }

            const updated = await Discount.findByIdAndUpdate(id, updateData, { new: true });
            return this.buildResponse("OK", "Cập nhật mã giảm giá thành công", updated);
        } catch (error) {
            return this.buildResponse("ERR", "Lỗi máy chủ nội bộ", null, 500);
        }
    }

    // Vô hiệu hóa mã giảm giá (soft delete)
    static async deactivateDiscount(id) {
        try {
            const discount = await Discount.findById(id);
            if (!discount) {
                return this.buildResponse("ERR", "Không tìm thấy mã giảm giá", null, 404);
            }

            if (!discount.isActive) {
                return this.buildResponse("OK", "Mã giảm giá đã được vô hiệu hóa", discount);
            }

            discount.isActive = false;
            await discount.save();
            return this.buildResponse("OK", "Vô hiệu hóa mã giảm giá thành công", discount);
        } catch (error) {
            return this.buildResponse("ERR", "Lỗi máy chủ nội bộ", null, 500);
        }
    }

    // Tìm kiếm mã giảm giá theo keyword
    static async searchDiscounts(keyword, query = {}) {
        try {
            const { page = 1, limit = 10, sortBy = 'createdAt', sortOrder = 'desc' } = query;
            
            if (!keyword || !keyword.trim()) {
                return this.buildResponse("ERR", "Từ khóa tìm kiếm là bắt buộc", null, 400);
            }
            
            // Build search criteria
            const searchCriteria = {
                $or: [
                    { code: { $regex: keyword.trim(), $options: 'i' } }
                ]
            };
            
            // Build sort object
            let sortOption = { createdAt: -1 }; // default
            const sortField = sortBy.toString().trim().toLowerCase();
            const order = sortOrder.toString().trim().toLowerCase() === 'asc' ? 1 : -1;
            
            switch (sortField) {
                case 'code':
                    sortOption = { code: order };
                    break;
                case 'discountpercent':
                case 'discount_percent':
                    sortOption = { discountPercent: order };
                    break;
                case 'createdat':
                case 'created_at':
                case 'created':
                    sortOption = { createdAt: order };
                    break;
                default:
                    sortOption = { createdAt: -1 };
            }
            
            // Execute search with pagination
            const discounts = await Discount.find(searchCriteria)
                .sort(sortOption)
                .skip((page - 1) * limit)
                .limit(Number(limit))
                .lean();
                
            const total = await Discount.countDocuments(searchCriteria);
            
            return this.buildResponse("OK", "Kết quả tìm kiếm mã giảm giá", {
                discounts,
                pagination: {
                    page: Number(page),
                    limit: Number(limit),
                    total,
                    totalPages: Math.ceil(total / limit)
                }
            });
        } catch (error) {
            return this.buildResponse("ERR", "Lỗi máy chủ nội bộ", null, 500);
        }
    }

    // Áp dụng mã giảm giá cho đơn hàng
    static async applyDiscount(code, orderTotal) {
        try {
            if (!code || typeof orderTotal !== "number") {
                return this.buildResponse("ERR", "Mã và tổng đơn hàng số là bắt buộc", null, 400);
            }

            const discount = await Discount.findOne({ code: String(code).toUpperCase() });
            if (!discount) {
                return this.buildResponse("ERR", "Không tìm thấy mã giảm giá", null, 404);
            }

            if (!discount.isActive) {
                return this.buildResponse("ERR", "Mã giảm giá không hoạt động", null, 400);
            }

            const now = new Date();
            if (now < discount.startDate || now > discount.endDate) {
                return this.buildResponse("ERR", "Mã giảm giá không trong thời gian hiệu lực", null, 400);
            }

            if (orderTotal < (discount.minOrderValue || 0)) {
                return this.buildResponse("ERR", "Đơn hàng không đạt giá trị tối thiểu", null, 400);
            }

            const discountAmount = Math.floor(orderTotal * (discount.discountPercent / 100));
            
            // Áp dụng giới hạn số tiền giảm tối đa nếu có
            const finalDiscountAmount = discount.maxDiscountAmount 
                ? Math.min(discountAmount, discount.maxDiscountAmount)
                : discountAmount;
                
            const totalAfterDiscount = orderTotal - finalDiscountAmount;

            return this.buildResponse("OK", "Áp dụng mã giảm giá thành công", {
                success: true,
                code: discount.code,
                discountPercent: discount.discountPercent,
                discountAmount: finalDiscountAmount, // Số tiền giảm thực tế (đã áp dụng giới hạn)
                originalDiscountAmount: discountAmount, // Số tiền giảm theo % (chưa áp dụng giới hạn)
                maxDiscountAmount: discount.maxDiscountAmount, // Giới hạn tối đa
                totalAfterDiscount
            });
        } catch (error) {
            return this.buildResponse("ERR", "Lỗi máy chủ nội bộ", null, 500);
        }
    }
}

module.exports = DiscountService;
