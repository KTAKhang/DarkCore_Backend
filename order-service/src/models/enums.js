const USER_ROLES = ["customer", "admin", "technician"];

const USER_STATUS = ["active", "inactive"];

const USER_LOYALTY_SEGMENTS = ["new", "bronze", "silver", "gold", "platinum"];

const ORDER_STATUS_NAMES = ["pending", "confirmed", "processing", "shipped", "delivered", "cancelled", "returned"];

const PAYMENT_METHODS = ["cod", "bank_transfer", "credit_card", "e_wallet"];

const PAYMENT_STATUS = ["pending", "paid", "failed", "refunded"];

const ORDER_STATUS_COLORS = {
    pending: "#FFA500",
    confirmed: "#007BFF", 
    processing: "#6F42C1",
    shipped: "#17A2B8",
    delivered: "#28A745",
    cancelled: "#DC3545",
    returned: "#6C757D"
};

module.exports = {
	USER_ROLES,
	USER_STATUS,
	USER_LOYALTY_SEGMENTS,
	ORDER_STATUS_NAMES,
	PAYMENT_METHODS,
	PAYMENT_STATUS,
	ORDER_STATUS_COLORS,
};


