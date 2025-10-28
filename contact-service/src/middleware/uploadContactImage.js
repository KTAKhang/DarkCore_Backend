const multer = require("multer");
const cloudinary = require("../config/cloudinaryConfig");

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 }, // Giới hạn 5MB
});

const uploadContactImage = (req, res, next) => {
  const handler = upload.single("image");
  handler(req, res, async (err) => {
    if (err) {
      return res.status(400).json({ status: "ERR", message: err.message });
    }
    try {
      if (req.file && req.file.buffer) {
        const mimeType = req.file.mimetype || "image/jpeg";
        const base64 = req.file.buffer.toString("base64");
        const dataUri = `data:${mimeType};base64,${base64}`;
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

module.exports = { uploadContactImage };