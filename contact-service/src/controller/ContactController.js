const ContactService = require("../services/ContactService");

/**
 * 🧩 Helper: chuẩn hóa response
 */
const sendResponse = (res, statusCode, success, message, data = null, error = null) => {
  const response = { success, message };
  if (data) response.data = data;
  if (error) response.error = error;
  return res.status(statusCode).json(response);
};

/**
 * 🧩 Helper: log lỗi cho dễ debug
 */
const logError = (functionName, error) => {
  console.error(`[ContactController][${functionName}] ❌`, error.message);
  if (error.stack) console.error(error.stack);
};

// =====================================================
// 📌 GET /api/contacts
// =====================================================
const listContacts = async (req, res) => {
  try {
    const result = await ContactService.listContacts(req.query, req.user);
    return sendResponse(res, 200, true, "Fetched contact list successfully", result);
  } catch (error) {
    logError("listContacts", error);
    return sendResponse(res, 500, false, "Error fetching contacts", null, error.message);
  }
};

// =====================================================
// 📌 GET /api/contacts/stats
// =====================================================
const getContactStats = async (req, res) => {
  try {
    const stats = await ContactService.getContactStats();
    return sendResponse(res, 200, true, "Fetched contact statistics successfully", stats);
  } catch (error) {
    logError("getContactStats", error);
    return sendResponse(res, 500, false, "Error fetching stats", null, error.message);
  }
};

// =====================================================
// 📌 GET /api/contacts/:id
// =====================================================
const getContactById = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await ContactService.getContactById(id, req.user.role);
    return sendResponse(res, 200, true, "Fetched contact details successfully", result);
  } catch (error) {
    logError("getContactById", error);
    const statusCode = error.message.includes("not found") ? 404 : 500;
    return sendResponse(res, statusCode, false, error.message, null, error.message);
  }
};

// =====================================================
// 📌 POST /api/contacts
// =====================================================
const createContact = async (req, res) => {
  const publicIds = [];
  try {
    if (!req.user) return sendResponse(res, 401, false, "Unauthorized");

    const data = {
      ...req.body,
      userId: req.user._id,
      attachments: req.body.attachments || [],
      image: req.body.image,
      imagePublicId: req.body.imagePublicId,
    };

    const newContact = await ContactService.createContact(data);
    return sendResponse(res, 201, true, "Contact request created successfully", newContact);
  } catch (error) {
    logError("createContact", error);
    return sendResponse(res, 500, false, "Error creating contact", null, error.message);
  } finally {
    // Cleanup Cloudinary nếu lỗi
    if (res.statusCode >= 400) {
      if (req.body.imagePublicId) publicIds.push(req.body.imagePublicId);
      if (req.body.attachments)
        publicIds.push(...req.body.attachments.map((a) => a.publicId));
      if (publicIds.length > 0) {
        await ContactService.deleteCloudinaryFiles(publicIds);
      }
    }
  }
};

// =====================================================
// 📌 PUT /api/contacts/:id
// (Admin: cập nhật status + thêm/cập nhật reply)
// =====================================================
const updateContact = async (req, res) => {
  const publicIds = [];
  try {
    const { id } = req.params;
    const { status, replyMessage, isInternal, attachments } = req.body;
    const adminId = req.user?._id;

    const result = await ContactService.updateContact({
      id,
      status,
      replyMessage,
      isInternal,
      attachments,
      adminId,
    });

    return sendResponse(res, 200, true, "Contact updated successfully", result);
  } catch (error) {
    logError("updateContact", error);
    return sendResponse(res, 500, false, "Error updating contact", null, error.message);
  } finally {
    // Cleanup file nếu có lỗi
    if (res.statusCode >= 400 && req.body.attachments) {
      publicIds.push(...req.body.attachments.map((a) => a.publicId));
      if (publicIds.length > 0) {
        await ContactService.deleteCloudinaryFiles(publicIds);
      }
    }
  }
};

// =====================================================
// 📌 DELETE /api/contacts/:id
// =====================================================
const deleteContact = async (req, res) => {
  try {
    const { id } = req.params;
    await ContactService.deleteContact(id);
    return sendResponse(res, 200, true, "Contact deleted successfully");
  } catch (error) {
    logError("deleteContact", error);
    const statusCode = error.message.includes("not found") ? 404 : 500;
    return sendResponse(res, statusCode, false, error.message, null, error.message);
  }
};

// =====================================================
// 📤 Export controller
// =====================================================
module.exports = {
  listContacts,
  getContactStats,
  getContactById,
  createContact,
  updateContact, // ✅ thay cho updateContactStatus & createReply
  deleteContact,
};
