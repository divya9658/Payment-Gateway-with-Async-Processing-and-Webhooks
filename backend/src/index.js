require("dotenv").config();
const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const routes = require("./routes");

const app = express();
const PORT = process.env.PORT || 8000;

app.use(helmet());
app.use(cors());
app.use(express.json());

// Routes
app.use("/api/v1", routes);

// Health Check
app.get("/health", (req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

// Error Handling
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    error: {
      code: "INTERNAL_SERVER_ERROR",
      description: "An unexpected error occurred",
    },
  });
});

if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`API Server running on port ${PORT}`);
  });
}

module.exports = app;
