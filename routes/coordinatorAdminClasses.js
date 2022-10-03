const express = require("express");
const router = express.Router();
const dotenv = require("dotenv");
const moment = require("moment");

// Load env variables
dotenv.config({ path: "./config/config.env" });

// Creating the base for Airtable API Calls
const base = require("airtable").base("appvnq3LlzxDIHTqI");

//? Get all classes for a particular Student from classes base - Limit 100
router.get("/:airtableIdOrRole", (req, res) => {
  let formattedClasses = [];
  // Getting today's date & time for comparision
  const today = new Date();
  today.setHours(0);
  today.setMinutes(0);
  today.setSeconds(0);
  let momentToday = moment(today);

  base("Classes")
    .select({
      // Selecting the first 10000 records in Grid view:
      maxRecords: 10000,
      view: "All Classes",
      fields: [
        "Class Name",
        "CourseID",
        "Teacher Name",
        "Class Time",
        "Topics",
        "Students",
        "Students Attended",
        "Class Completed",
        "Section",
        "ClassID",
        "Course",
        "Zoom Link",
        "Zoom Recording",
        "Location",
        "Student Names",
        "Coordinator",
        "Notes",
      ],
    })
    .eachPage(
      function page(allClasses, fetchNextPage) {
        // This function (`page`) will get called for each page of allClasses.

        try {
          const formatClass = (singleClass) => {
            let classStatus = null;

            let classTime = new Date(singleClass.get("Class Time"));
            classTime.setHours(0);
            classTime.setMinutes(0);
            classTime.setSeconds(0);
            let momentClassTime = moment(classTime);
            let daysFromToday = momentClassTime.diff(momentToday, "days");

            // Checking if the student is included for the class

            const momentdate = moment(singleClass.get("Class Time")).format("Do MMMM YY, h:mm a");

            // Marking class status for the student based on attendance marked
            if (singleClass.get("Class Completed")) {
              // Checking if any students attendance has been marked
              classStatus = "Completed";
            } else if (daysFromToday >= 0) {
              classStatus = "Upcoming";
            } else if (daysFromToday < 0) {
              classStatus = "Overdue";
            }

            const formattedSingleClass = {
              className: singleClass.get("Class Name"),
              teacherName: singleClass.get("Teacher Name"),
              classTime: singleClass.get("Class Time"),
              formattedTime: momentdate,
              classTopics: singleClass.get("Topics"),
              courseSection: singleClass.get("Section") ? singleClass.get("Section") : "",
              classID: singleClass.get("ClassID"),
              courseID: singleClass.get("Course") ? singleClass.get("Course")[0] : "",
              zoomLink: singleClass.get("Zoom Link"),
              zoomRecording: singleClass.get("Zoom Recording"),
              classStatus,
              location: singleClass.get("Location"),
              students: singleClass.get("Student Names"),
              notes: singleClass.get("Notes"),
              daysFromToday: daysFromToday,
            };

            formattedClasses.push(formattedSingleClass);
          };

          allClasses.forEach(function (singleClass) {
            if (req.params.airtableIdOrRole == "admin") {
              formatClass(singleClass);
            } else if (singleClass.get("Coordinator")) {
              // if coordinator is requesting return only students assigned to him/her
              if (singleClass.get("Coordinator").includes(req.params.airtableIdOrRole)) {
                formatClass(singleClass);
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

        /*
           To fetch the next page of classes, call `fetchNextPage`.
           If there are more classes, `page` will get called again.
           If there are no more classes, `done` will get called.
    */

        fetchNextPage();
      },
      function done(err) {
        try {
          // Getting all the upcoming classes
          const upcomingClasses = formattedClasses.filter((eachClass) => {
            return eachClass.classStatus == "Upcoming";
          });

          const upcomingSorted = upcomingClasses.sort(function compare(a, b) {
            var dateA = new Date(a.classTime);
            var dateB = new Date(b.classTime);
            return dateA - dateB;
          });

          // Getting all the Missed classes
          const overdueClasses = formattedClasses.filter((eachClass) => {
            return eachClass.classStatus == "Overdue";
          });

          const overdueSorted = overdueClasses.sort(function compare(a, b) {
            var dateA = new Date(a.classTime);
            var dateB = new Date(b.classTime);
            return dateA - dateB;
          });

          const completedClasses = formattedClasses.filter((eachClass) => {
            return eachClass.classStatus == "Completed";
          });

          const completedSorted = completedClasses.sort(function compare(a, b) {
            var dateA = new Date(a.classTime);
            var dateB = new Date(b.classTime);
            return dateB - dateA;
          });

          res.status(200).json({
            success: true,
            msg: `This gets all the classes for the admin`,
            // formattedClasses,
            upcomingClasses: upcomingSorted,
            completedClasses: completedSorted,
            overdueClasses: overdueSorted,
          });
          if (err) {
            console.error(err);
            return;
          }
        } catch (error) {
          console.log("error is", error);

          res.status(500).json({
            success: false,
            error: `${error}`,
          });
        }
      }
    );
});

module.exports = router;
