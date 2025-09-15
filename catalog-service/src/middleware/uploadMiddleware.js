const multer = require("multer");
const cloudinary = require("../config/cloudinaryConfig");

// Sử dụng memory storage để nhận file từ multipart/form-data
const upload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 5 * 1024 * 1024 }, // giới hạn 5MB
});

// Middleware: Upload ảnh category lên Cloudinary nếu có file 'image'
const uploadCategoryImage = (req, res, next) => {
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
                    folder: "categories",
                    resource_type: "image",
                });
                req.body.image = result.secure_url;
                req.body.imagePublicId = result.public_id;
            }
            return next();
        } catch (error) {
            return res.status(500).json({ status: "ERR", message: error.message });
        }
    });
};

module.exports = { uploadCategoryImage };

// Middleware: Upload nhiều ảnh product lên Cloudinary nếu có field 'images'
const uploadProductImages = (req, res, next) => {
    const handler = upload.array("images", 10);
    handler(req, res, async (err) => {
        if (err) {
            return res.status(400).json({ status: "ERR", message: err.message });
        }
        try {
            if (Array.isArray(req.files) && req.files.length > 0) {
                const uploads = req.files.map((file) => {
                    const mimeType = file.mimetype || "image/jpeg";
                    const base64 = file.buffer.toString("base64");
                    const dataUri = `data:${mimeType};base64,${base64}`;
                    return cloudinary.uploader.upload(dataUri, {
                        folder: "products",
                        resource_type: "image",
                    });
                });
                const results = await Promise.all(uploads);
                req.body.images = results.map((r) => r.secure_url);
                req.body.imagePublicIds = results.map((r) => r.public_id);
            }
            return next();
        } catch (error) {
            return res.status(500).json({ status: "ERR", message: error.message });
        }
    });
};

module.exports.uploadProductImages = uploadProductImages;


