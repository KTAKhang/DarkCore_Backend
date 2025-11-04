const express = require("express");
const dotenv = require("dotenv");
const mongoose = require("mongoose");
const cors = require("cors");
const bodyParser = require("body-parser");
const routes = require("./routes");
const swaggerDocs = require("./swagger");

dotenv.config();



const app = express();
const port = process.env.PORT || 3123;


app.use(cors());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

routes(app);
swaggerDocs(app);

mongoose
    .connect(process.env.MONGO_URL)
    .then(() => {
        // Connected to MongoDB
    })
    .catch((error) => {
        // MongoDB connection error
    });

app.listen(port, () => {
    console.log(`🚀 Staff Product Service running on port ${port}`);
  });