const express = require("express");
const router = express.Router();
const dotenv = require("dotenv");
const moment = require("moment");

// Load env variables
dotenv.config({ path: "./config/config.env" });

// Creating the base for Airtable API Calls
const base = require("airtable").base("appvnq3LlzxDIHTqI");

//? Get dashboard statistics for Coordinator & Admin -  Limit 10,000 classes & 1000 Students
router.get("/:airtableIdOrRole", (req, res) => {
  let totalStudents = 0;
  let upcomingClasses = 0;
  let missedClasses = 0;
  let completedClasses = 0;

  const today = new Date();
  today.setHours(0);
  today.setMinutes(0);
  today.setSeconds(0);
  // let newTime = today.toDateString();
  let momentToday = moment(today);

  const getClasses = () => {
    base("Classes")
      .select({
        // Selecting the first 3 records in Grid view:
        maxRecords: 10000,
        view: "All Classes",
        fields: ["Class Time", "Class Completed", "Coordinator"],
      })
      .eachPage(
        function page(records, fetchNextPage) {
          // This function (`page`) will get called for each page of records.

          try {
            const incrementClassCount = (record) => {
              let classTime = new Date(record.get("Class Time"));
              classTime.setHours(0);
              classTime.setMinutes(0);
              classTime.setSeconds(0);
              let momentClassTime = moment(classTime);
              let daysFromToday = momentClassTime.diff(momentToday, "days");

              if (record.get("Class Completed")) {
                completedClasses++;
              } else if (daysFromToday >= 0) {
                upcomingClasses++;
              } else if (daysFromToday < 0) {
                missedClasses++;
              }
            };

            records.forEach(function (record) {
              if (req.params.airtableIdOrRole == "admin") {
                incrementClassCount(record);
              } else if (record.get("Coordinator")) {
                // if coordinator is requesting return only students assigned to him/her
                if (record.get("Coordinator").includes(req.params.airtableIdOrRole)) {
                  incrementClassCount(record);
                }
              }
            });
          } catch (error) {
            console.log("error is", error);

            res.status(500).json({
              success: false,
              error: `${error}`,
            });
          }

          fetchNextPage();
        },
        function done(err) {
          if (err) {
            console.error(err);
            return;
          }

          res.status(200).json({
            success: true,
            msg: `This gets dashboard statistics for the Coordinator and Admin`,
            stats: {
              totalStudents,
              upcomingClasses,
              completedClasses,
              missedClasses,
            },
          });
          return;
        }
      );
  };

  const getStudents = () => {
    base("Students")
      .select({
        // Selecting the first 500 records in Grid view:
        maxRecords: 1000,
        view: "Grid view",
        fields: ["Name", "Coordinators"],
      })
      .eachPage(
        function page(records, fetchNextPage) {
          if (req.params.airtableIdOrRole == "admin") {
            totalStudents = totalStudents + records.length;
          } else {
            records.forEach(function (record) {
              // if coordinator is requesting return only students assigned to him/her
              if (record.get("Coordinators") && record.get("Coordinators").includes(req.params.airtableIdOrRole)) {
                totalStudents++;
              }
            });
          }

          fetchNextPage();
        },
        function done(err) {
          if (err) {
            console.error(err);
            return;
          }
          getClasses();
        }
      );
  };

  getStudents();
});

module.exports = router;
