const express = require("express");
const dotenv = require("dotenv");
const mongoose = require("mongoose");
const cors = require("cors");
const bodyParser = require("body-parser");
const routes = require("./routes");
const swaggerDocs = require("./swagger");

dotenv.config();

const app = express();
const port = process.env.PORT || 3004;

app.use(cors());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

routes(app);
swaggerDocs(app);

mongoose
  .connect(process.env.MONGO_URL)
  .then(() => {
    console.log(" Connected to MongoDB");
    console.log(` Swagger Docs available at http://localhost:${port}/api-docs`);
  })
  .catch((error) => {
    console.error(" MongoDB connection error:", error);
  });

app.listen(port, () => {
  console.log(` Server is running on http://localhost:${port}`);
});
