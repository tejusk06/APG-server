const express = require("express");
const router = express.Router();
const dotenv = require("dotenv");
const moment = require("moment");

// Load env variables
dotenv.config({ path: "./config/config.env" });

// Creating the base for Airtable API Calls
const base = require("airtable").base("appvnq3LlzxDIHTqI");

//? Get all topics for a particular Student from classes base
router.get("/:studentCourse", (req, res) => {
  // Getting today's date & time for comparision
  const today = new Date();

  const studentID = req.params.studentCourse ? req.params.studentCourse.split("-")[0] : "";
  const courseID = req.params.studentCourse ? req.params.studentCourse.split("-")[1] : "";

  // Function to mark topics completed as true or false - this is called after all the topics are retrived
  base("Students").find(`${studentID}`, function (err, record) {
    if (err) {
      console.error(err);
      return;
    }

    const completedTopics = record.get("Completed Topic IDs");

    // Send all formatted topics as response
    res.status(200).json({
      success: true,
      msg: `This gets all the topics for a student`,
      completedTopics: completedTopics ? completedTopics : [],
    });
  });
});

module.exports = router;
