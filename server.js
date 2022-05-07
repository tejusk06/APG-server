const express = require("express");
const dotenv = require("dotenv");

// Load env variables
dotenv.config({ path: "./config/config.env" });

const app = express();

// Get class for a
app.get("/api/v1/classes/:studentId", (req, res) => {
  res
    .status(200)
    .json({
      success: true,
      msg: ` This gets all the classes for ${req.params.studentId} from ${process.env.AIRTABLE_KEY}`,
    });
});

// Update a class for student
/*
app.put("/api/v1/classes/:studentId", (req, res) => {
  res.status(200).json({ success: true, msg: `${req.params.studentId}` });
});
*/

// Route to create records
/*
app.post("/api/v1/classes/:studentId", (req, res) => {
  res.status(200).json({ success: true, msg: `${req.params.studentId}` });
});
*/

const PORT = process.env.PORT || 5000;

app.listen(PORT, console.log(`Server running in ${process.env.NODE_ENV} mode on port ${PORT}`));
