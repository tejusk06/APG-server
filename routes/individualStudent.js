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
          englishClassesAttended: record.get("Dashboard - English Classes Attended"),
          mathClassesAttended: record.get("Dashboard - Math Classes Attended"),
          scienceClassesAttended: record.get("Dashboard - Science Classes Attended"),
          completedTests: record.get("Dashboard - Tests Completed"),
          pendingTests: record.get("Dashboard - Tests Pending"),
          satMathTopicsCompleted: record.get("Sat Math Topics Completed"),
          satReadingTopicsCompleted: record.get("Sat Reading Topics Completed"),
          satWritingTopicsCompleted: record.get("Sat Writing Topics Completed"),
          actScienceTopicsCompleted: record.get("Act Science Topics Completed"),
          actReadingTopicsCompleted: record.get("Act Reading Topics Completed"),
          actEnglishTopicsCompleted: record.get("Act English Topics Completed"),
          mathHomeworkCompleted: record.get("Dashboard - Math Homework Completed"),
          mathHomeworkPending: record.get("Dashboard - Math Homework Pending"),
          readingHomeworkCompleted: record.get("Dashboard - Reading Homework Completed"),
          readingHomeworkPending: record.get("Dashboard - Reading Homework Pending"),
          writingHomeworkCompleted: record.get("Dashboard - Writing Homework Completed"),
          writingHomeworkPending: record.get("Dashboard - Writing Homework Pending"),
          scienceHomeworkCompleted: record.get("Dashboard - Science Homework Completed"),
          scienceHomeworkPending: record.get("Dashboard - Science Homework Pending"),
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
