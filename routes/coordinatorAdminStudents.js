const express = require("express");
const router = express.Router();
const dotenv = require("dotenv");
const moment = require("moment");

// Load env variables
dotenv.config({ path: "./config/config.env" });

// Creating the base for Airtable API Calls
const base = require("airtable").base("appvnq3LlzxDIHTqI");

//   Function to check if date in past
const dateInPast = function (firstDate) {
  const today = new Date();
  if (firstDate.setHours(0, 0, 0, 0) <= today.setHours(0, 0, 0, 0)) {
    return true;
  }
  return false;
};

// Function to add days
Date.prototype.addDays = function (days) {
  var date = new Date(this.valueOf());
  date.setDate(date.getDate() + days);
  return date;
};

//? Get all students from the students database for Coordinator and Admin - Limit 1000
router.get("/:airtableIdOrRole", (req, res) => {
  let allStudents = [];

  base("Students")
    .select({
      // Selecting the first 3 records in Grid view:
      maxRecords: 1000,
      view: "Grid view",
      fields: [
        "Name",
        "Location",
        "Student Image",
        "Total Classes",
        "Classes Attended",
        "Total Tests",
        "Test Due Dates",
        "Total Homework",
        "Homework Completed",
        "Homework Due Date",
        "Total Topics Completed",
        "StudentID",
        "CourseID",
        "Test Status",
        "Coordinators",
      ],
    })
    .eachPage(
      function page(records, fetchNextPage) {
        // This function (`page`) will get called for each page of records.

        // Function to add student to the all students array
        const addStudent = (record) => {
          let testsCompleted = 0;
          let testsUpcoming = 0;

          let homeworkCompleted = 0;
          let homeworkPending = 0;

          let classesAttended = 0;

          const testsDatesArray = record.get("Test Due Dates");

          if (record.get("Test Status")) {
            const testStatusArray = record.get("Test Status").split(",");
            for (let i = 0; i < testsDatesArray.length; i++) {
              if (testStatusArray[i]) {
                testsCompleted++;
              } else {
                const testDate = testsDatesArray[i];
                const isPast = dateInPast(new Date(testDate).addDays(1));
                if (!isPast) {
                  testsUpcoming++;
                }
              }
            }
          }

          // Logic for homework Stats

          const homeworkStatusArray = record.get("Homework Completed")
            ? record.get("Homework Completed").split(",")
            : [];
          const homeworkDatesArray = record.get("Homework Due Date") ? record.get("Homework Due Date") : [];

          for (let i = 0; i < homeworkDatesArray.length; i++) {
            if (homeworkStatusArray[i]) {
              homeworkCompleted++;
            } else {
              const homeworkDate = homeworkDatesArray[i];
              const isPast = dateInPast(new Date(homeworkDate).addDays(1));

              if (!isPast) {
                homeworkPending++;
              }
            }
          }

          if (record.get("Classes Attended")) {
            classesAttended = record.get("Classes Attended").length;
          }

          let singleStudent = {
            name: record.get("Name"),
            location: record.get("Location"),
            image: record.get("Student Image") ? record.get("Student Image")[0].url : null,
            classes: record.get("Total Classes"),
            classesAttended: classesAttended,
            tests: record.get("Total Tests"),
            testsCompleted: testsCompleted,
            testsUpcoming: testsUpcoming,
            homework: record.get("Total Homework"),
            homeworkCompleted: homeworkCompleted,
            homeworkPending: homeworkPending,
            topics: record.get("Total Topics Completed"),
            studentID: record.get("StudentID"),
            courseID: record.get("CourseID") ? record.get("CourseID")[0] : "",
          };

          allStudents.push(singleStudent);
        };

        records.forEach(function (record) {
          // if admin is requesting return all students
          if (req.params.airtableIdOrRole == "admin") {
            addStudent(record);
          } else if (record.get("Coordinators")) {
            // if coordinator is requesting return only students assigned to him/her
            if (record.get("Coordinators").includes(req.params.airtableIdOrRole)) {
              addStudent(record);
            }
          }
        });

        // To fetch the next page of records, call `fetchNextPage`.
        // If there are more records, `page` will get called again.
        // If there are no more records, `done` will get called.
        fetchNextPage();
      },
      function done(err) {
        if (err) {
          console.error(err);
          return;
        }

        res.status(200).json({
          success: true,
          msg: `This gets all the students for Coordinator and Admin`,
          allStudents,
        });
      }
    );
});

module.exports = router;
