const express = require("express");
const router = express.Router();
const dotenv = require("dotenv");
const moment = require("moment");

// Load env variables
dotenv.config({ path: "./config/config.env" });

// Creating the base for Airtable API Calls
const base = require("airtable").base("appvnq3LlzxDIHTqI");

//? Get individual student from the students database for Admin
router.get("/:studentID", (req, res) => {
  const studentID = req.params.studentID;

  base("Students").find(`${studentID}`, function (err, record) {
    try {
      if (err) {
        console.error("error is", err);
        res.status(200).json({
          error: err,
        });

        return;
      }

      res.status(200).json({
        success: true,
        msg: `This gets the student details`,
        student: {
          name: record.get("Name"),
          email: record.get("Email Id"),
          image: record.get("Student Image") ? record.get("Student Image")[0].url : null,
          id: record.get("StudentID"),
          courseID: record.get("CourseID") ? record.get("CourseID")[0] : "",
          completedTopics: record.get("Topics Completed Names") ? record.get("Topics Completed Names").split(",") : [],
          completedTopicsSections: record.get("Topics Completed Sections")?.split(",") ?? [],
        },
      });
    } catch (error) {
      console.log("error is", error);

      res.status(500).json({
        success: false,
        error: `${error}`,
      });
    }
  });
});

module.exports = router;
