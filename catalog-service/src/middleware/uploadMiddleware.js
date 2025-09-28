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
            console.error(`❌ Multer error:`, err);
            return res.status(400).json({ status: "ERR", message: err.message });
        }
        try {
            console.log(`🔍 Upload middleware - req.files:`, req.files);
            console.log(`🔍 Upload middleware - req.body.images:`, req.body.images);
            console.log(`🔍 Upload middleware - Content-Type:`, req.headers['content-type']);
            console.log(`🔍 Upload middleware - req.body keys:`, Object.keys(req.body));
            
            // ✅ Kiểm tra cấu hình Cloudinary
            console.log(`🔍 Cloudinary config check:`, {
                cloud_name: process.env.CLOUD_NAME ? 'SET' : 'NOT SET',
                api_key: process.env.API_KEY ? 'SET' : 'NOT SET',
                api_secret: process.env.API_SECRET ? 'SET' : 'NOT SET'
            });
            
            // ✅ Xử lý file upload thực tế
            if (Array.isArray(req.files) && req.files.length > 0) {
                console.log(`🔍 Processing ${req.files.length} uploaded files`);
                const uploads = req.files.map((file, index) => {
                    console.log(`🔍 File ${index}:`, {
                        fieldname: file.fieldname,
                        originalname: file.originalname,
                        mimetype: file.mimetype,
                        size: file.size
                    });
                    
                    const mimeType = file.mimetype || "image/jpeg";
                    const base64 = file.buffer.toString("base64");
                    const dataUri = `data:${mimeType};base64,${base64}`;
                    
                    return cloudinary.uploader.upload(dataUri, {
                        folder: "products",
                        resource_type: "image",
                    });
                });
                
                console.log(`🔍 Starting Cloudinary upload...`);
                const results = await Promise.all(uploads);
                console.log(`🔍 Cloudinary upload results:`, results);
                
                req.body.images = results.map((r) => r.secure_url);
                req.body.imagePublicIds = results.map((r) => r.public_id);
                console.log(`🔍 Final uploaded images:`, req.body.images);
            } else {
                // ✅ Xử lý trường hợp frontend gửi object với uid (không có file thực tế)
                if (req.body.images) {
                    console.log(`🔍 No files uploaded, processing existing images data`);
                    // Giữ nguyên dữ liệu từ frontend (có thể là object với uid)
                    // ProductService sẽ xử lý logic này
                } else {
                    console.log(`🔍 No images data provided`);
                }
            }
            return next();
        } catch (error) {
            console.error(`❌ Upload middleware error:`, error);
            console.error(`❌ Error stack:`, error.stack);
            return res.status(500).json({ status: "ERR", message: error.message });
        }
    });
};

module.exports.uploadProductImages = uploadProductImages;


