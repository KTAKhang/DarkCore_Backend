const multer = require("multer");
const cloudinary = require("../config/cloudinaryConfig");

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
});

// ==========================
// Upload ẢNH CHÍNH (1 file)
// ==========================
const uploadContactImage = async (req, res, next) => {
  const handler = upload.single("image");
  handler(req, res, async (err) => {
    if (err) return res.status(400).json({ status: "ERR", message: err.message });

    try {
      if (req.file && req.file.buffer) {
        const mimeType = req.file.mimetype || "image/jpeg";
        const dataUri = `data:${mimeType};base64,${req.file.buffer.toString("base64")}`;

        const result = await cloudinary.uploader.upload(dataUri, {
          folder: "contacts",
          resource_type: "image",
        });

        req.body.image = result.secure_url;
        req.body.imagePublicId = result.public_id;
      }
      next();
    } catch (error) {
      res.status(500).json({ status: "ERR", message: error.message });
    }
  });
};

// ==========================
// Upload FILE ĐÍNH KÈM (nhiều file)
// ==========================
const uploadContactAttachments = async (req, res, next) => {
  const handler = upload.array("attachments", 5);
  handler(req, res, async (err) => {
    if (err) return res.status(400).json({ status: "ERR", message: err.message });

    try {
      if (req.files && req.files.length > 0) {
        const attachments = await Promise.all(
          req.files.map(async (file) => {
            const mimeType = file.mimetype;
            const dataUri = `data:${mimeType};base64,${file.buffer.toString("base64")}`;

            const result = await cloudinary.uploader.upload(dataUri, {
              folder: "contacts/attachments",
              resource_type: mimeType.startsWith("image") ? "image" : "raw",
            });

            return {
              url: result.secure_url,
              fileName: file.originalname,
              fileType: mimeType,
              publicId: result.public_id,
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

module.exports = {
  uploadContactImage,
  uploadContactAttachments,
};
