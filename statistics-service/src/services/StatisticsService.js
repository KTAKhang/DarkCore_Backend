const Order = require("../models/OrderModel");
const User = require("../models/UserModel");
const Product = require("../models/ProductModel");
const OrderDetail = require("../models/OrderDetailModel");
const OrderStatus = require("../models/OrderStatusModel");
const RepairRequest = require("../models/RepairRequestModel");
const ExcelJS = require('exceljs');
const moment = require('moment');

// Helper function to get OrderStatus by name
const getOrderStatusByName = async (statusName) => {
    const status = await OrderStatus.findOne({ name: statusName, status: true, isActive: true });
    return status;
};

// Overview Statistics
const getOverviewStatistics = async () => {
    try {
        // Count total users (role customer)
        const totalUsers = await User.countDocuments({ role_id: { $exists: true } });
        
        // Count total orders
        const totalOrders = await Order.countDocuments();
        
        // Count total products
        const totalProducts = await Product.countDocuments({ status: true });
        
        // Calculate total revenue from delivered orders
        const deliveredStatus = await getOrderStatusByName('delivered');
        const filter = deliveredStatus ? { orderStatusId: deliveredStatus._id } : {};
        
        const revenueAgg = await Order.aggregate([
            { $match: filter },
            { $group: { _id: null, total: { $sum: "$totalPrice" } } }
        ]);
        const totalRevenue = revenueAgg[0]?.total || 0;

        return {
            status: "OK",
            data: {
                totalUsers,
                totalOrders,
                totalRevenue,
                totalProducts
            }
        };
    } catch (error) {
        throw error;
    }
};

// Revenue by Month
const getRevenueByMonth = async (year) => {
    try {
        const startDate = new Date(year, 0, 1);
        const endDate = new Date(year, 11, 31, 23, 59, 59);

        // Get delivered status
        const deliveredStatus = await getOrderStatusByName('delivered');
        const statusFilter = deliveredStatus ? { orderStatusId: deliveredStatus._id } : {};

        const revenueData = await Order.aggregate([
            {
                $match: {
                    createdAt: { $gte: startDate, $lte: endDate },
                    ...statusFilter
                }
            },
            {
                $group: {
                    _id: { $month: "$createdAt" },
                    totalRevenue: { $sum: "$totalPrice" }
                }
            },
            { $sort: { _id: 1 } }
        ]);

        // Fill missing months with 0
        const monthlyRevenue = Array.from({ length: 12 }, (_, i) => {
            const monthData = revenueData.find(item => item._id === i + 1);
            return {
                month: i + 1,
                totalRevenue: monthData?.totalRevenue || 0
            };
        });

        return {
            status: "OK",
            data: monthlyRevenue
        };
    } catch (error) {
        throw error;
    }
};

// Revenue by Date (Today)
const getRevenueByDate = async (date) => {
    try {
        const startDate = new Date(date);
        startDate.setHours(0, 0, 0, 0);
        const endDate = new Date(date);
        endDate.setHours(23, 59, 59, 999);

        const deliveredStatus = await getOrderStatusByName('delivered');
        const statusFilter = deliveredStatus ? { orderStatusId: deliveredStatus._id } : {};

        const revenueData = await Order.aggregate([
            {
                $match: {
                    createdAt: { $gte: startDate, $lte: endDate },
                    ...statusFilter
                }
            },
            {
                $group: {
                    _id: null,
                    totalRevenue: { $sum: "$totalPrice" }
                }
            }
        ]);

        return {
            status: "OK",
            data: [{
                date: date,
                totalRevenue: revenueData[0]?.totalRevenue || 0
            }]
        };
    } catch (error) {
        throw error;
    }
};

// New Customers
const getNewCustomers = async (date) => {
    try {
        const startDate = new Date(date);
        startDate.setHours(0, 0, 0, 0);
        const endDate = new Date(date);
        endDate.setHours(23, 59, 59, 999);

        const newCustomersCount = await User.countDocuments({
            createdAt: { $gte: startDate, $lte: endDate }
        });

        return {
            status: "OK",
            data: [{
                date: date,
                newCustomers: newCustomersCount,
                newCustomerCount: newCustomersCount,
                count: newCustomersCount,
                totalNewCustomers: newCustomersCount
            }]
        };
    } catch (error) {
        throw error;
    }
};

// Sales by Date
const getSalesByDate = async (date) => {
    try {
        const startDate = new Date(date);
        startDate.setHours(0, 0, 0, 0);
        const endDate = new Date(date);
        endDate.setHours(23, 59, 59, 999);

        const orders = await Order.find({
            createdAt: { $gte: startDate, $lte: endDate }
        }).select('_id');

        const orderIds = orders.map(o => o._id);

        const salesData = await OrderDetail.aggregate([
            {
                $match: {
                    orderId: { $in: orderIds }
                }
            },
            {
                $group: {
                    _id: null,
                    totalSoldQuantity: { $sum: "$quantity" },
                    totalOrders: { $sum: 1 }
                }
            }
        ]);

        const data = salesData[0] || { totalSoldQuantity: 0, totalOrders: 0 };

        return {
            status: "OK",
            data: [{
                date: date,
                totalSoldQuantity: data.totalSoldQuantity || 0,
                totalOrders: orders.length,
                totalAmount: data.totalSoldQuantity || 0,
                orderCount: orders.length
            }]
        };
    } catch (error) {
        throw error;
    }
};

// Top Products
const getTopProducts = async (limit = 3) => {
    try {
        const deliveredStatus = await getOrderStatusByName('delivered');
        
        // Get all delivered orders
        const deliveredOrders = deliveredStatus 
            ? await Order.find({ orderStatusId: deliveredStatus._id }).select('_id')
            : await Order.find().select('_id');
        
        const orderIds = deliveredOrders.map(o => o._id);

        const topProducts = await OrderDetail.aggregate([
            { $match: { orderId: { $in: orderIds } } },
            {
                $group: {
                    _id: "$productId",
                    totalQuantitySold: { $sum: "$quantity" },
                    totalRevenue: { $sum: "$totalPrice" },
                    orderCount: { $sum: 1 }
                }
            },
            { $sort: { totalRevenue: -1 } },
            { $limit: limit },
            {
                $lookup: {
                    from: "products",
                    localField: "_id",
                    foreignField: "_id",
                    as: "productInfo"
                }
            },
            { $unwind: { path: "$productInfo", preserveNullAndEmptyArrays: true } },
            {
                $project: {
                    productId: "$_id",
                    productName: { $ifNull: ["$productInfo.name", "Unknown Product"] },
                    totalQuantitySold: 1,
                    totalRevenue: 1,
                    orderCount: 1
                }
            }
        ]);

        return {
            status: "OK",
            data: topProducts
        };
    } catch (error) {
        throw error;
    }
};

// Pending Orders Count
const getPendingOrdersCount = async () => {
    try {
        const pendingStatus = await getOrderStatusByName('pending');
        const count = pendingStatus 
            ? await Order.countDocuments({ orderStatusId: pendingStatus._id })
            : 0;
        
        return {
            status: "OK",
            data: count
        };
    } catch (error) {
        throw error;
    }
};

// Top Customer Trends
const getTopCustomerTrends = async (month, year, limit = 3) => {
    try {
        let startDate, endDate;
        
        // If month is null or 0, calculate for the whole year
        if (!month || month === 0) {
            startDate = new Date(year, 0, 1); // January 1st
            endDate = new Date(year, 11, 31, 23, 59, 59); // December 31st
        } else {
            startDate = new Date(year, month - 1, 1);
            endDate = new Date(year, month, 0, 23, 59, 59);
        }

        const deliveredStatus = await getOrderStatusByName('delivered');
        const statusFilter = deliveredStatus ? { orderStatusId: deliveredStatus._id } : {};

        const topCustomers = await Order.aggregate([
            {
                $match: {
                    createdAt: { $gte: startDate, $lte: endDate },
                    ...statusFilter
                }
            },
            {
                $group: {
                    _id: "$userId",
                    totalOrders: { $sum: 1 },
                    totalSpent: { $sum: "$totalPrice" },
                    lastPurchase: { $max: "$createdAt" }
                }
            },
            { $sort: { totalSpent: -1 } },
            { $limit: limit },
            {
                $lookup: {
                    from: "users",
                    localField: "_id",
                    foreignField: "_id",
                    as: "userInfo"
                }
            },
            { $unwind: { path: "$userInfo", preserveNullAndEmptyArrays: true } },
            {
                $project: {
                    userId: "$_id",
                    name: { $ifNull: ["$userInfo.user_name", "Unknown User"] },
                    email: { $ifNull: ["$userInfo.email", ""] },
                    totalOrders: 1,
                    totalSpent: 1,
                    averageOrderValue: { $divide: ["$totalSpent", "$totalOrders"] },
                    lastPurchase: 1
                }
            }
        ]);

        return {
            status: "OK",
            data: topCustomers
        };
    } catch (error) {
        throw error;
    }
};

// Repair Monthly Revenue
const getRepairMonthlyRevenue = async (month, year) => {
    try {
        const startDate = new Date(year, month - 1, 1);
        const endDate = new Date(year, month, 0, 23, 59, 59);

        const data = await RepairRequest.aggregate([
            {
                $match: {
                    createdAt: { $gte: startDate, $lte: endDate },
                    status: "completed"
                }
            },
            {
                $group: {
                    _id: null,
                    totalRevenue: { $sum: "$estimatedCost" },
                    totalRepairs: { $sum: 1 }
                }
            }
        ]);

        const result = data[0] || { totalRevenue: 0, totalRepairs: 0 };

        return {
            status: "OK",
            data: {
                month,
                year,
                totalRevenue: result.totalRevenue,
                totalRepairs: result.totalRepairs,
                averageRepairValue: result.totalRepairs > 0 
                    ? result.totalRevenue / result.totalRepairs 
                    : 0
            }
        };
    } catch (error) {
        throw error;
    }
};

// Repair Revenue by Year (All 12 months)
const getRepairRevenueByYear = async (year) => {
    try {
        const startDate = new Date(year, 0, 1);
        const endDate = new Date(year, 11, 31, 23, 59, 59);

        const revenueData = await RepairRequest.aggregate([
            {
                $match: {
                    createdAt: { $gte: startDate, $lte: endDate },
                    status: "completed"
                }
            },
            {
                $group: {
                    _id: { $month: "$createdAt" },
                    totalRevenue: { $sum: "$estimatedCost" },
                    totalRepairs: { $sum: 1 }
                }
            },
            { $sort: { _id: 1 } }
        ]);

        // Fill missing months with 0
        const monthlyRevenue = Array.from({ length: 12 }, (_, i) => {
            const monthData = revenueData.find(item => item._id === i + 1);
            return {
                month: i + 1,
                totalRevenue: monthData?.totalRevenue || 0,
                totalRepairs: monthData?.totalRepairs || 0
            };
        });

        return {
            status: "OK",
            data: monthlyRevenue
        };
    } catch (error) {
        throw error;
    }
};

// Repair Overview
const getRepairOverview = async () => {
    try {
        const [total, waiting, inProgress, completed, canceled] = await Promise.all([
            RepairRequest.countDocuments(),
            RepairRequest.countDocuments({ status: "waiting" }),
            RepairRequest.countDocuments({ status: "in-progress" }),
            RepairRequest.countDocuments({ status: "completed" }),
            RepairRequest.countDocuments({ status: "canceled" })
        ]);

        return {
            status: "OK",
            data: {
                total,
                waiting,
                inProgress,
                completed,
                canceled
            }
        };
    } catch (error) {
        throw error;
    }
};

// Export Dashboard Excel
const exportDashboardExcel = async (year) => {
    try {
        const workbook = new ExcelJS.Workbook();
        
        // Fetch data first
        const revenueData = await getRevenueByMonth(year);
        const repairMonthlyData = [];
        
        for (let month = 1; month <= 12; month++) {
            const data = await getRepairMonthlyRevenue(month, year);
            repairMonthlyData.push({
                month: month,
                totalRevenue: data.data.totalRevenue,
                totalRepairs: data.data.totalRepairs
            });
        }

        // Sheet 1: Total Revenue (Sales + Repair) - PRIORITY SHEET
        const totalRevenueSheet = workbook.addWorksheet('Tổng doanh thu');
        const totalRevenueData = [];
        
        // Combine sales and repair revenue by month
        for (let month = 1; month <= 12; month++) {
            const salesRevenue = revenueData.data.find(item => item.month === month)?.totalRevenue || 0;
            const repairRevenue = repairMonthlyData.find(item => item.month === month)?.totalRevenue || 0;
            
            totalRevenueData.push({
                month: month,
                salesRevenue: salesRevenue,
                repairRevenue: repairRevenue,
                totalRevenue: salesRevenue + repairRevenue
            });
        }
        
        totalRevenueSheet.columns = [
            { header: 'Tháng', key: 'month', width: 15 },
            { header: 'Doanh thu bán hàng (VNĐ)', key: 'salesRevenue', width: 25 },
            { header: 'Doanh thu sửa chữa (VNĐ)', key: 'repairRevenue', width: 25 },
            { header: 'Tổng doanh thu (VNĐ)', key: 'totalRevenue', width: 25 }
        ];
        
        totalRevenueData.forEach(item => {
            totalRevenueSheet.addRow(item);
        });
        
        // Add total row at the end
        const totalSalesRevenue = totalRevenueData.reduce((sum, item) => sum + item.salesRevenue, 0);
        const totalRepairRevenue = totalRevenueData.reduce((sum, item) => sum + item.repairRevenue, 0);
        const grandTotal = totalSalesRevenue + totalRepairRevenue;
        
        const totalRow = totalRevenueSheet.addRow({
            month: 'TỔNG CỘNG',
            salesRevenue: totalSalesRevenue,
            repairRevenue: totalRepairRevenue,
            totalRevenue: grandTotal
        });
        
        // Styling header
        totalRevenueSheet.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } };
        totalRevenueSheet.getRow(1).fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'FF722ED1' }
        };
        totalRevenueSheet.getRow(1).alignment = { vertical: 'middle', horizontal: 'center' };
        
        // Styling total row
        totalRow.font = { bold: true, color: { argb: 'FFFFFFFF' } };
        totalRow.fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'FF722ED1' }
        };
        totalRow.alignment = { vertical: 'middle', horizontal: 'center' };
        
        // Sheet 2: Revenue by Month (Sales)
        const revenueSheet = workbook.addWorksheet('Doanh thu bán hàng');
        
        revenueSheet.columns = [
            { header: 'Tháng', key: 'month', width: 15 },
            { header: 'Doanh thu (VNĐ)', key: 'totalRevenue', width: 20 }
        ];
        
        revenueData.data.forEach(item => {
            revenueSheet.addRow(item);
        });
        
        // Styling
        revenueSheet.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } };
        revenueSheet.getRow(1).fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'FF13C2C2' }
        };
        revenueSheet.getRow(1).alignment = { vertical: 'middle', horizontal: 'center' };

        // Sheet 3: Repair Revenue by Month
        const repairSheet = workbook.addWorksheet('Doanh thu sửa chữa');
        
        repairSheet.columns = [
            { header: 'Tháng', key: 'month', width: 15 },
            { header: 'Doanh thu sửa chữa (VNĐ)', key: 'totalRevenue', width: 25 },
            { header: 'Số yêu cầu hoàn thành', key: 'totalRepairs', width: 20 }
        ];
        
        repairMonthlyData.forEach(item => {
            repairSheet.addRow(item);
        });
        
        repairSheet.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } };
        repairSheet.getRow(1).fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'FFFA8C16' }
        };
        repairSheet.getRow(1).alignment = { vertical: 'middle', horizontal: 'center' };

        // Sheet 4: Top Products
        const productsSheet = workbook.addWorksheet('Sản phẩm bán chạy');
        const productsData = await getTopProducts(10);
        
        productsSheet.columns = [
            { header: 'Tên sản phẩm', key: 'productName', width: 40 },
            { header: 'Số lượng bán', key: 'totalQuantitySold', width: 18 },
            { header: 'Doanh thu (VNĐ)', key: 'totalRevenue', width: 20 },
            { header: 'Số đơn hàng', key: 'orderCount', width: 15 }
        ];
        
        productsData.data.forEach(item => {
            productsSheet.addRow(item);
        });
        
        productsSheet.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } };
        productsSheet.getRow(1).fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'FF13C2C2' }
        };
        productsSheet.getRow(1).alignment = { vertical: 'middle', horizontal: 'center' };

        // Sheet 5: Top Customers (for the whole year)
        const customersSheet = workbook.addWorksheet('Top khách hàng');
        const customersData = await getTopCustomerTrends(0, year, 20); // month = 0 for whole year, limit = 20
        
        customersSheet.columns = [
            { header: 'Tên khách hàng', key: 'name', width: 30 },
            { header: 'Email', key: 'email', width: 35 },
            { header: 'Tổng đơn hàng', key: 'totalOrders', width: 18 },
            { header: 'Tổng chi tiêu (VNĐ)', key: 'totalSpent', width: 20 }
        ];
        
        customersData.data.forEach(item => {
            customersSheet.addRow(item);
        });
        
        customersSheet.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } };
        customersSheet.getRow(1).fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'FF52C41A' }
        };
        customersSheet.getRow(1).alignment = { vertical: 'middle', horizontal: 'center' };

        return await workbook.xlsx.writeBuffer();
    } catch (error) {
        throw error;
    }
};

module.exports = {
    getOverviewStatistics,
    getRevenueByMonth,
    getRevenueByDate,
    getNewCustomers,
    getSalesByDate,
    getTopProducts,
    getPendingOrdersCount,
    getTopCustomerTrends,
    getRepairMonthlyRevenue,
    getRepairRevenueByYear,
    getRepairOverview,
    exportDashboardExcel
};

