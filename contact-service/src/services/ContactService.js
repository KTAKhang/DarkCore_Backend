const Contact = require("../model/ContactModel");
const ContactReply = require("../model/ContactReplyModel");
const { v4: uuidv4 } = require("uuid");
const cloudinary = require("../config/cloudinaryConfig");

// ==============================
// 🟢 CREATE CONTACT
// ==============================
const createContact = async (data) => {
    try {
        const ticketId = `TICKET-${uuidv4().slice(0, 8)}`;
        const newContact = new Contact({
            ...data,
            ticketId,
            attachments: data.attachments || [],
            image: data.image || null,
            imagePublicId: data.imagePublicId || null,
            status: data.status || "Pending",
            priority: data.priority || "Medium",
        });
        return await newContact.save();
    } catch (error) {
        console.error("[ContactService][createContact]", error);
        throw new Error(`Failed to create contact: ${error.message}`);
    }
};

// ==============================
// 🟡 LIST CONTACTS - WITH REPLIES
// ==============================
const listContacts = async (queryParams, user) => {
    try {
        const {
            page = 1,
            limit = 10,
            status,
            reason,
            priority,
            sortBy = "createdAt",
            order = "desc",
            search,
            dateFrom,
            dateTo,
        } = queryParams;

        const query = { isDeleted: false };

        // Check admin role
        console.log("🔍 [DEBUG] User info:", {
            userId: user?._id,
            role: user?.role,
            role_name: user?.role_name,
            isAdmin: user?.isAdmin
        });

        if (user) {
            const isAdmin = user.isAdmin === true ||
                user.role?.toLowerCase() === "admin" ||
                user.role_name?.toLowerCase() === "admin";

            if (!isAdmin) {
                query.userId = user._id;
                console.log("👤 [User Filter] Applied userId filter:", user._id);
            } else {
                console.log("👑 [Admin] Fetching all contacts - NO userId filter");
            }
        }

        if (status && status !== "all") query.status = status;
        if (reason && reason !== "all") query.reason = reason;
        if (priority && priority !== "all") query.priority = priority;
        if (search) {
            query.$or = [
                { subject: { $regex: `^${search}`, $options: "i" } },
                { message: { $regex: `^${search}`, $options: "i" } },
                { "userId.user_name": { $regex: `^${search}`, $options: "i" } },
                { "userId.email": { $regex: `^${search}`, $options: "i" } },
            ];
        }


        if (dateFrom) query.createdAt = { $gte: new Date(dateFrom) };
        if (dateTo) query.createdAt = { ...query.createdAt, $lte: new Date(dateTo) };

        const pageNum = parseInt(page);
        const limitNum = parseInt(limit);
        const sortOrder = order === "asc" ? 1 : -1;

        console.log("📋 [Final Query]:", JSON.stringify(query, null, 2));

        // ✅ Fetch contacts với userId + updatedBy
        const contacts = await Contact.find(query)
            .populate("userId", "email user_name avatar")
            .populate("updatedBy", "email user_name avatar")
            .sort({ [sortBy]: sortOrder })
            .skip((pageNum - 1) * limitNum)
            .limit(limitNum)
            .lean(); // Dùng lean() để tối ưu performance

        // ✅ Fetch replies cho từng contact
        const contactIds = contacts.map(c => c._id);

        // Nếu là admin thì lấy tất cả replies (kể cả internal)
        // Nếu là user thì chỉ lấy replies không phải internal
        const replyQuery = user?.isAdmin || user?.role?.toLowerCase() === "admin" || user?.role_name?.toLowerCase() === "admin"
            ? { contactId: { $in: contactIds } }
            : { contactId: { $in: contactIds }, isInternal: false };

        const replies = await ContactReply.find(replyQuery)
            .populate("senderId", "user_name email role_name avatar")
            .sort({ createdAt: 1 }) // Sắp xếp theo thời gian tăng dần
            .lean();

        // ✅ Gắn replies vào từng contact
        const contactsWithReplies = contacts.map(contact => ({
            ...contact,
            replies: replies.filter(r => r.contactId.toString() === contact._id.toString())
        }));

        const total = await Contact.countDocuments(query);

        console.log(`✅ [Result] Found ${contactsWithReplies.length} contacts out of ${total} total`);

        return {
            data: contactsWithReplies,
            total,
            page: pageNum,
            pages: Math.ceil(total / limitNum)
        };
    } catch (error) {
        console.error("[ContactService][listContacts]", error);
        throw new Error(`Failed to list contacts: ${error.message}`);
    }
};


// ==============================
// 🟠 GET CONTACT BY ID
// ==============================
const getContactById = async (id, userRole) => {
    try {
        const contact = await Contact.findById(id)
            .populate("userId", "user_name email role_name avatar")
            .populate("updatedBy", "user_name email role_name avatar");

        if (!contact || contact.isDeleted) throw new Error("Contact not found ( is deleted )");

        const query = userRole === "admin" ? { contactId: id } : { contactId: id, isInternal: false };
        const replies = await ContactReply.find(query)
            .populate("senderId", "user_name email role_name avatar");

        return { contact, replies };
    } catch (error) {
        console.error("[ContactService][getContactById]", error);
        throw new Error(`Failed to get contact details: ${error.message}`);
    }
};

// ==============================
// 🟣 UPDATE CONTACT (status + reply)
// ==============================
const updateContact = async ({ id, status, replyMessage, isInternal, attachments, adminId }) => {
    const session = await Contact.startSession();
    session.startTransaction();
    try {
        // 1️⃣ Cập nhật trạng thái liên hệ (nếu có)
        const contact = await Contact.findById(id).session(session);
        if (!contact || contact.isDeleted) throw new Error("Contact not found");

        if (status && contact.status !== status) {
            contact.status = status;
            contact.updatedBy = adminId;
            contact.updatedAt = new Date();
            await contact.save({ session });
        }

        // 2️⃣ Nếu có replyMessage thì tạo mới reply
        let reply = null;
        if (replyMessage && replyMessage.trim() !== "") {
            reply = new ContactReply({
                contactId: id,
                senderId: adminId,
                senderRole: "admin",
                message: replyMessage,
                isInternal: isInternal || false,
                attachments: attachments || [],
            });
            await reply.save({ session });
        }

        await session.commitTransaction();
        session.endSession();

        // Lấy lại dữ liệu mới nhất để trả về
        const updated = await Contact.findById(id)
            .populate("userId", "user_name email role_name avatar")
            .populate("updatedBy", "user_name email role_name avatar");

        return { contact: updated, reply };
    } catch (error) {
        await session.abortTransaction();
        session.endSession();
        console.error("[ContactService][updateContact]", error);
        throw new Error(`Failed to update contact: ${error.message}`);
    }
};

// ==============================
// 🔵 GET CONTACT STATS - ✅ NEW
// ==============================
const getContactStats = async () => {
    try {
        const total = await Contact.countDocuments({ isDeleted: false });
        const pending = await Contact.countDocuments({ isDeleted: false, status: "Pending" });
        const resolved = await Contact.countDocuments({ isDeleted: false, status: "Resolved" });
        const closed = await Contact.countDocuments({ isDeleted: false, status: "Closed" });

        return {
            total,
            pending,
            resolved,
            closed,
        };
    } catch (error) {
        console.error("[ContactService][getContactStats]", error);
        throw new Error(`Failed to get contact statistics: ${error.message}`);
    }
};

// ==============================
// ⚫ DELETE CONTACT
// ==============================
const deleteContact = async (id) => {
    try {
        const contact = await Contact.findByIdAndUpdate(id, { isDeleted: true }, { new: true });
        if (!contact) throw new Error("Contact not found");
        return contact;
    } catch (error) {
        console.error("[ContactService][deleteContact]", error);
        throw new Error(`Failed to delete contact: ${error.message}`);
    }
};

// ==============================
// ⚪ DELETE CLOUDINARY FILES
// ==============================
const deleteCloudinaryFiles = async (publicIds) => {
    if (!publicIds || publicIds.length === 0) return;
    await Promise.all(
        publicIds.map((id) =>
            cloudinary.uploader.destroy(id).catch((err) => console.error("[Cloudinary Delete Error]", err))
        )
    );
};

// ==============================
// 📤 EXPORT
// ==============================
module.exports = {
    createContact,
    listContacts,
    getContactById,
    updateContact,
    getContactStats, // ✅ Thêm export
    deleteContact,
    deleteCloudinaryFiles,
};