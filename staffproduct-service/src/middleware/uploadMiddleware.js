const multer = require("multer");
const cloudinary = require("../config/cloudinaryConfig");

// Sử dụng memory storage để nhận file từ multipart/form-data
const upload = multer({
    storage: multer.memoryStorage(),
    limits: { 
        fileSize: 5 * 1024 * 1024, // 5MB
        files: 10 // max 10 files
    },
});

// ✅ THÊM ERROR HANDLER CHO MULTER
const handleMulterError = (err, req, res, next) => {
    console.error("MULTER ERROR:", err);
    console.error("MULTER ERROR TYPE:", err.name);
    console.error("MULTER ERROR MESSAGE:", err.message);
    
    if (err instanceof multer.MulterError) {
        return res.status(400).json({ 
            status: "ERR", 
            message: `Upload error: ${err.message}` 
        });
    }
    return res.status(400).json({ 
        status: "ERR", 
        message: err.message 
    });
};

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
// ✅ SỬA LẠI uploadProductImages với better error handling
const uploadProductImages = (req, res, next) => {
    console.log("📥 uploadProductImages START");
    console.log("📥 Content-Type:", req.headers['content-type']);
    console.log("📥 Method:", req.method);
    
    const handler = upload.array("images", 10);
    
    handler(req, res, async (err) => {
        if (err) {
            console.error("❌ MULTER ERROR:", err);
            console.error("❌ ERROR NAME:", err.name);
            console.error("❌ ERROR MESSAGE:", err.message);
            console.error("❌ ERROR CODE:", err.code);
            
            // ✅ Trả về error chi tiết hơn
            return res.status(400).json({ 
                status: "ERR", 
                message: `Multer error: ${err.message}`,
                error: err.name
            });
        }
        
        try {
            console.log("✅ Multer parsed successfully");
            console.log("📥 Body fields:", Object.keys(req.body));
            console.log("📥 Files count:", req.files?.length || 0);
            
            if (req.files && req.files.length > 0) {
                console.log("📥 Files details:", req.files.map(f => ({
                    name: f.originalname,
                    size: f.size,
                    type: f.mimetype
                })));
            }
            
            // ✅ Xử lý file upload thực tế
            if (Array.isArray(req.files) && req.files.length > 0) {
                console.log("📤 Uploading to Cloudinary...");
                
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
                console.log("✅ Cloudinary upload success:", results.length, "images");
                
                req.body.images = results.map((r) => r.secure_url);
                req.body.imagePublicIds = results.map((r) => r.public_id);
            }
            
            return next();
        } catch (error) {
            console.error("❌ Upload middleware error:", error);
            console.error("❌ Error stack:", error.stack);
            return res.status(500).json({ 
                status: "ERR", 
                message: error.message 
            });
        }
    });
};

module.exports.uploadProductImages = uploadProductImages;


