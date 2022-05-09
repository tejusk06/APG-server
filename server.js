const express = require("express");
const dotenv = require("dotenv");
const moment = require("moment");
var cors = require("cors");
const _ = require("lodash");

// Load env variables
dotenv.config({ path: "./config/config.env" });

const app = express();
app.use(cors());

// Configuring Airtable
// var Airtable = require("airtable");

// Airtable.configure({
//   endpointUrl: "https://api.airtable.com",
//   apiKey: `${process.env.AIRTABLE_API_KEY}`,
// });
// var base = Airtable.base("appvnq3LlzxDIHTqI");

const base = require("airtable").base("appvnq3LlzxDIHTqI");

//? Get all classes for a particular student from classes base
app.get("/api/v1/classes/student/:studentID", (req, res) => {
  let formattedClasses = [];
  // Getting today's date & time for comparision
  const today = new Date();

  base("Classes")
    .select({
      // Selecting the first 300 records in Grid view:
      maxRecords: 300,
      view: "Grid view",
      fields: ["Name", "Teacher Name", "Class Time", "Topics", "Students", "Students Attended", "Class Completed"],
      // filterByFormula: "AND({Students} = 'SAT English', {Name} != 'SAT English')",
    })
    .eachPage(
      function page(allClasses, fetchNextPage) {
        // This function (`page`) will get called for each page of allClasses.

        // Sorting the allClasses in decending order
        // allClasses = _.sortBy(allClasses, function (singleClass) {
        //   return new Date(singleClass.fields["Class Time"]);
        // }).reverse();

        allClasses.forEach(function (singleClass) {
          let students = singleClass.get("Students");
          let studentsAttended = singleClass.get("Students Attended");
          let classStatus = null;

          // Checking if the student is included for the class
          if (students.includes(req.params.studentID)) {
            console
              .log
              // singleClass.get("Name"),
              // singleClass.get("Class Completed")
              // singleClass.get("Students")
              // singleClass.get("Class Time"),
              // singleClass.get("Topics")
              // momentdate
              // classStatus
              // studentsAttended
              ();

            // Marking class status for the student based on attendance marked
            if (singleClass.get("Class Completed")) {
              // Checking if any students attendance has been marked
              if (studentsAttended) {
                if (studentsAttended.includes(req.params.studentID)) {
                  classStatus = "Completed";
                } else {
                  classStatus = "Missed";
                }
              } else {
                classStatus = "Unknown";
              }
            } else {
              classStatus = "Upcoming";
            }

            const momentdate = moment(singleClass.get("Class Time")).format("Do MMMM ");

            const formattedSingleClass = {
              className: singleClass.get("Name"),
              teacherName: singleClass.get("Teacher Name"),
              classTime: singleClass.get("Class Time"),
              formattedTime: momentdate,
              classTopics: singleClass.get("Topics"),
              classStatus,
            };

            formattedClasses.push(formattedSingleClass);
          }
        });
        /*
         To fetch the next page of classes, call `fetchNextPage`.
         If there are more classes, `page` will get called again.
         If there are no more classes, `done` will get called.
  */

        fetchNextPage();
      },
      function done(err) {
        console.log("Done.");

        // Getting all the upcoming classes
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
        missedClasses.sort((d1, d2) => new Date(d1.formattedTime).getTime() - new Date(d2.formattedTime).getTime())
          .reverse;

        res.status(200).json({
          success: true,
          msg: `This gets all the classes`,
          // formattedClasses,
          upcomingClasses,
          completedClasses,
          missedClasses,
          unknownClasses,
        });
        if (err) {
          console.error(err);
          return;
        }
      }
    );
});

//? Get all classes for a student from the students base
/*
app.get("/api/v1/student/classes/:studentID", (req, res) => {
  let formattedClasses = [];
  var classesProcessed = 0;
  const studentID = req.params.studentID;

  const sendResponse = () => {
    res.status(200).json({
      success: true,
      msg: `This gets all the classes for a student`,
      classes: formattedClasses,
    });
  };

  console.log("API HIT");

  // Getting today's date & time for comparision
  const today = new Date();

  // Getting the classes first from student row.
  base("Students").find(studentID, function (err, record) {
    const studentClasses = record.get("Classes");

    console.log("Got the student record");

    // Getting details of each class from the classes base
    studentClasses.forEach((eachClass) => {
      //TODO --------------------------------------------------------------------------------
      base("Classes").find(eachClass, function (err, singleClass) {
        if (err) {
          console.error(err);
          return;
        }
        const momentdate = moment(singleClass.get("Class Time")).format("Do MMMM");
        let students = singleClass.get("Students");
        let classStatus = undefined;

        // Adding status to class based on the time and attendance
        if (moment(singleClass.get("Class Time")).isAfter(today)) {
          classStatus = "Upcoming";
        } else {
          console.log("entered class");
          const studentsAttended = singleClass.get("Students Attended");
          if (studentsAttended) {
            if (studentsAttended.includes(studentID)) {
              classStatus = "Completed";
            } else {
              classStatus = "Missed";
            }
          } else {
            classStatus = "Missed";
          }

          // TODO Add logic for missed and attended classes after attendance logic is done on airtable
          // Get students from students attended column then check if the student exists there if yes "completed" if not then "missed"
        }

        // Checking if the student is included for the class

        console.log(
          singleClass.get("Name")
          // singleClass.get("Class Time"),
          // singleClass.get("Topics"),
          // momentdate,
          // classStatus
        );

        const formattedSingleClass = {
          className: singleClass.get("Name"),
          teacherName: singleClass.get("Teacher Name"),
          classTime: singleClass.get("Class Time"),
          formattedTime: momentdate,
          classTopics: singleClass.get("Topics"),
          classStatus,
        };

        formattedClasses.push(formattedSingleClass);

        classesProcessed++;

        // Run this after all classes have been processed
        if (classesProcessed == studentClasses.length) {
          const upcomingClasses = formattedClasses.filter((eachClass) => {
            return eachClass.classStatus == "Upcoming";
          });

          const completedClasses = formattedClasses.filter((eachClass) => {
            return eachClass.classStatus == "Completed";
          });

          const missedClasses = formattedClasses.filter((eachClass) => {
            return eachClass.classStatus == "Missed";
          });

          console.log("sending response");
          res.status(200).json({
            success: true,
            msg: `This gets all the classes`,
            upcomingClasses,
            completedClasses,
            missedClasses,
            // formattedClasses,
          });
        }
      });

      //TODO --------------------------------------------------------------------------------
    });

    if (err) {
      console.error(err);
      return;
    }
  });
});
*/

const PORT = process.env.PORT || 5000;

app.listen(PORT, console.log(`Server running in ${process.env.NODE_ENV} mode on port ${PORT}`));
