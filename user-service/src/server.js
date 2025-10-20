const express = require("express");
const dotenv = require("dotenv");
const mongoose = require("mongoose");
const bodyParser = require("body-parser");
const routes = require("./routes");
const swaggerDocs = require("./swagger");
const cookieParser = require("cookie-parser");

require("./models");

dotenv.config();

const app = express();
const port = process.env.PORT || 3210;


app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
app.use(cookieParser());


app.get("/", (req, res) => {
    res.json({ message: "🚀 Auth Service is running!" });
});
routes(app);
swaggerDocs(app);


mongoose
    .connect(process.env.MONGO_URL)
    .then(() => {
        console.log("✅ Connected to MongoDB");
        console.log(`📘 Swagger Docs available at http://localhost:${port}`);
    })
    .catch((error) => {
        console.error("❌ MongoDB connection error:", error);
    });

app.listen(port, () => {
    console.log(`🚀 Auth Service running on http://localhost:${port}`);
});