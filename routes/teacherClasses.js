const express = require("express");
const router = express.Router();
const dotenv = require("dotenv");
const moment = require("moment");

// Load env variables
dotenv.config({ path: "./config/config.env" });

// Creating the base for Airtable API Calls
const base = require("airtable").base("appvnq3LlzxDIHTqI");

//? Get all classes for a particular teacher from classes base - Limit 2000
router.get("/:teacherID", (req, res) => {
  let formattedClasses = [];
  // Getting today's date & time for comparision
  const today = new Date();
  let newTime = today.toDateString();
  let momentToday = moment(newTime);

  const teacherID = req.params.teacherID;

  base("Classes")
    .select({
      // Selecting the first 300 records in Grid view:
      maxRecords: 2000,
      view: "All Classes",
      fields: [
        "Class Name",
        "ClassID",
        "Teacher Name",
        "TeacherID",
        "Class Time",
        "Topics",
        "Class Completed",
        "Zoom Link",
        "Zoom Recording",
        "Location",
        "Student Names",
        "Notes",
      ],
      filterByFormula: `({TeacherID} = '${teacherID}')`,
    })
    .eachPage(
      function page(allClasses, fetchNextPage) {
        // This function (`page`) will get called for each page of allClasses.

        allClasses.forEach(function (singleClass) {
          let classStatus = null;

          let classTime = new Date(singleClass.get("Class Time")).toDateString();
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
            classID: singleClass.get("ClassID"),
            zoomLink: singleClass.get("Zoom Link"),
            zoomRecording: singleClass.get("Zoom Recording"),
            classStatus,
            location: singleClass.get("Location"),
            students: singleClass.get("Student Names"),
            notes: singleClass.get("Notes"),
            daysFromToday: daysFromToday,
          };

          formattedClasses.push(formattedSingleClass);
        });
        /*
           To fetch the next page of classes, call `fetchNextPage`.
           If there are more classes, `page` will get called again.
           If there are no more classes, `done` will get called.
    */

        fetchNextPage();
      },
      function done(err) {
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

        // Getting all the unknown classes
        const unknownClasses = formattedClasses.filter((eachClass) => {
          return eachClass.classStatus == "Unknown";
        });

        // Sorting Unknown classes in decending order
        unknownClasses.sort((d1, d2) => new Date(d1.formattedTime).getTime() - new Date(d2.formattedTime).getTime())
          .reverse;

        res.status(200).json({
          success: true,
          msg: `This gets all the classes for a teacher`,
          // formattedClasses,
          upcomingClasses: upcomingSorted,
          completedClasses: completedSorted,
          overdueClasses: overdueSorted,
          unknownClasses,
        });
        if (err) {
          console.error(err);
          return;
        }
      }
    );
});

module.exports = router;
