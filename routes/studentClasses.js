const express = require("express");
const router = express.Router();
const dotenv = require("dotenv");
const moment = require("moment");

// Load env variables
dotenv.config({ path: "./config/config.env" });

// Creating the base for Airtable API Calls
const base = require("airtable").base("appvnq3LlzxDIHTqI");

//? Get all classes for a particular Student from classes base - Limit 100
router.get("/:studentCourse", (req, res) => {
  let formattedClasses = [];
  // Getting today's date & time for comparision
  const today = new Date();

  const studentID = req.params.studentCourse ? req.params.studentCourse.split("-")[0] : "";
  const courseID = req.params.studentCourse ? req.params.studentCourse.split("-")[1] : "";

  base("Classes")
    .select({
      // Selecting the first 500 records in Grid view:
      maxRecords: 100,
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
        "ClassID",
        "Zoom Link",
        "Zoom Recording",
        "Location",
        "Notes",
      ],

      filterByFormula: `({CourseID} = '${courseID}')`,
    })
    .eachPage(
      function page(allClasses, fetchNextPage) {
        // This function (`page`) will get called for each page of allClasses.

        try {
          allClasses.forEach(function (singleClass) {
            let students = singleClass.get("Students");
            let studentsAttended = singleClass.get("Students Attended");
            let classStatus = null;

            // Checking is the class has any assigned students?

            // Checking if the student is included for the class
            if (students && students.includes(studentID)) {
              // Marking class status for the student based on attendance marked

              if (singleClass.get("Class Completed")) {
                // Checking if any students attendance has been marked
                if (studentsAttended) {
                  if (studentsAttended.includes(studentID)) {
                    classStatus = "Completed";
                  } else {
                    classStatus = "Missed";
                  }
                } else {
                  // Setting status as missed if no students attended
                  classStatus = "Missed";
                }
              } else {
                classStatus = "Upcoming";
              }

              const momentdate = moment(singleClass.get("Class Time")).add(330, "minutes").format("Do MMMM, h:mm a");

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
                notes: singleClass.get("Notes"),
              };

              formattedClasses.push(formattedSingleClass);
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
        // Getting all the upcoming classes
        if (err) {
          console.log("error is", err);

          res.status(500).json({
            success: false,
            error: `${err}`,
          });

          return;
        }
        const upcomingClasses = formattedClasses.filter((eachClass) => {
          return eachClass.classStatus == "Upcoming";
        });

        // Sorting Upcoming classes in ascending order
        upcomingClasses.sort((d1, d2) => new Date(d1.formattedTime).getTime() - new Date(d2.formattedTime).getTime());

        const completedClasses = formattedClasses.filter((eachClass) => {
          return eachClass.classStatus == "Completed";
        });

        // Sorting Completed classes in decending order
        completedClasses.sort((d1, d2) => new Date(d1.formattedTime).getTime() - new Date(d2.formattedTime).getTime())
          .reverse;

        // Getting all the missed classes
        const missedClasses = formattedClasses.filter((eachClass) => {
          return eachClass.classStatus == "Missed";
        });

        // Sorting Missed classes in decending order
        missedClasses.sort((d1, d2) => new Date(d1.formattedTime).getTime() - new Date(d2.formattedTime).getTime())
          .reverse;

        // Getting all the unknown classes
        const unknownClasses = formattedClasses.filter((eachClass) => {
          return eachClass.classStatus == "Unknown";
        });

        // Sorting Unknown classes in decending order
        unknownClasses.sort((d1, d2) => new Date(d1.formattedTime).getTime() - new Date(d2.formattedTime).getTime())
          .reverse;

        res.status(200).json({
          success: true,
          msg: `This gets all the classes for a student`,
          upcomingClasses,
          completedClasses,
          missedClasses,
          unknownClasses,
        });
      }
    );
});

module.exports = router;
