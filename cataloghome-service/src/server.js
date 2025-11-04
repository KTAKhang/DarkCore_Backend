const express = require("express");
const dotenv = require("dotenv");
const mongoose = require("mongoose");
const cors = require("cors");
const bodyParser = require("body-parser");
const routes = require("./routes");
const swaggerDocs = require("./swagger");

dotenv.config();



const app = express();
const port = process.env.PORT || 3000;


app.use(cors());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

routes(app);
swaggerDocs(app);

mongoose
    .connect(process.env.MONGO_URL)
    .then(() => {
        console.log("✅ Kết nối MongoDB thành công!");
        console.log(`📊 Database: ${mongoose.connection.db.databaseName}`);
        console.log(`🌐 Host: ${mongoose.connection.host}`);
        console.log(`📝 Swagger Docs: http://localhost:${port}/api-docs`);
        console.log("=".repeat(50));
    })
    .catch((error) => {
        console.error("❌ Lỗi kết nối MongoDB:", error.message);
        process.exit(1);
    });

app.listen(port, () => {
    console.log("=".repeat(50));
    console.log(`🚀 Server đang chạy thành công!`);
    console.log(`🔗 URL: http://localhost:${port}`);
    console.log(`⏰ Thời gian khởi động: ${new Date().toLocaleString('vi-VN')}`);
    console.log("=".repeat(50));
});
