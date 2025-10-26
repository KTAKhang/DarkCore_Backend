const multer = require("multer");
const cloudinary = require("../config/cloudinaryConfig");

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 }, // Giới hạn 5MB
});

const uploadContactAttachments = (req, res, next) => {
  const handler = upload.array("attachments", 5);
  handler(req, res, async (err) => {
    if (err) return res.status(400).json({ status: "ERR", message: err.message });
    try {
      if (req.files) {
        const attachments = await Promise.all(
          req.files.map(async (file) => {
            const mimeType = file.mimetype;
            const base64 = file.buffer.toString("base64");
            const dataUri = `data:${mimeType};base64,${base64}`;
            const result = await cloudinary.uploader.upload(dataUri, {
              folder: "contacts/attachments",
              resource_type: mimeType.startsWith("image") ? "image" : "raw",
            });
            return {
              url: result.secure_url,
              fileName: file.originalname,
              fileType: mimeType,
              publicId: result.public_id
            };
          })
        );
        req.body.attachments = attachments;
      }
      next();
    } catch (error) {
      res.status(500).json({ status: "ERR", message: error.message });
    }
  });
};

module.exports = { uploadContactAttachments };