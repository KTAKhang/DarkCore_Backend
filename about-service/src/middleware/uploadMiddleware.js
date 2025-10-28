const multer = require("multer");
const cloudinary = require("../config/cloudinaryConfig");

// Sử dụng memory storage để nhận file từ multipart/form-data
const upload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 5 * 1024 * 1024 }, // giới hạn 5MB
});

// ============================================
// ABOUT US MIDDLEWARE
// ============================================

// Middleware: Upload logo About Us (1 ảnh)
const uploadAboutLogo = (req, res, next) => {
    const handler = upload.single("logo");
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
                    folder: "about/logo",
                    resource_type: "image",
                });
                
                req.body.logo = result.secure_url;
                req.body.logoPublicId = result.public_id;
            }
            return next();
        } catch (error) {
            return res.status(500).json({ status: "ERR", message: error.message });
        }
    });
};

// Middleware: Upload nhiều ảnh About Us (gallery)
const uploadAboutImages = (req, res, next) => {
    const handler = upload.array("images", 10);
    handler(req, res, async (err) => {
        if (err) {
            console.error(`❌ Multer error:`, err);
            return res.status(400).json({ status: "ERR", message: err.message });
        }
        try {
            if (Array.isArray(req.files) && req.files.length > 0) {
                const uploads = req.files.map((file) => {
                    const mimeType = file.mimetype || "image/jpeg";
                    const base64 = file.buffer.toString("base64");
                    const dataUri = `data:${mimeType};base64,${base64}`;
                    
                    return cloudinary.uploader.upload(dataUri, {
                        folder: "about/gallery",
                        resource_type: "image",
                    });
                });
                
                const results = await Promise.all(uploads);
                
                req.body.images = results.map((r) => r.secure_url);
                req.body.imagePublicIds = results.map((r) => r.public_id);
            }
            return next();
        } catch (error) {
            console.error(`❌ Upload middleware error:`, error);
            return res.status(500).json({ status: "ERR", message: error.message });
        }
    });
};

// Middleware: Upload CẢ logo VÀ images cho About Us (combined)
const uploadAboutLogoAndImages = (req, res, next) => {
    const handler = upload.fields([
        { name: 'logo', maxCount: 1 },
        { name: 'images', maxCount: 10 }
    ]);
    
    handler(req, res, async (err) => {
        if (err) {
            console.error(`❌ Multer error:`, err);
            return res.status(400).json({ status: "ERR", message: err.message });
        }
        try {
            // Upload logo nếu có
            if (req.files && req.files.logo && req.files.logo.length > 0) {
                const logoFile = req.files.logo[0];
                const mimeType = logoFile.mimetype || "image/jpeg";
                const base64 = logoFile.buffer.toString("base64");
                const dataUri = `data:${mimeType};base64,${base64}`;
                
                const result = await cloudinary.uploader.upload(dataUri, {
                    folder: "about/logo",
                    resource_type: "image",
                });
                
                req.body.logo = result.secure_url;
                req.body.logoPublicId = result.public_id;
            }
            
            // Upload images nếu có
            if (req.files && req.files.images && req.files.images.length > 0) {
                const uploads = req.files.images.map((file) => {
                    const mimeType = file.mimetype || "image/jpeg";
                    const base64 = file.buffer.toString("base64");
                    const dataUri = `data:${mimeType};base64,${base64}`;
                    
                    return cloudinary.uploader.upload(dataUri, {
                        folder: "about/gallery",
                        resource_type: "image",
                    });
                });
                
                const results = await Promise.all(uploads);
                
                req.body.images = results.map((r) => r.secure_url);
                req.body.imagePublicIds = results.map((r) => r.public_id);
            }
            
            return next();
        } catch (error) {
            console.error(`❌ Upload middleware error:`, error);
            return res.status(500).json({ status: "ERR", message: error.message });
        }
    });
};

// ============================================
// FOUNDER MIDDLEWARE
// ============================================

// Middleware: Upload avatar Founder (1 ảnh)
const uploadFounderAvatar = (req, res, next) => {
    const handler = upload.single("avatar");
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
                    folder: "founders/avatars",
                    resource_type: "image",
                });
                
                req.body.avatar = result.secure_url;
                req.body.avatarPublicId = result.public_id;
            }
            return next();
        } catch (error) {
            return res.status(500).json({ status: "ERR", message: error.message });
        }
    });
};

module.exports = {
    uploadAboutLogo,
    uploadAboutImages,
    uploadAboutLogoAndImages,
    uploadFounderAvatar,
};

