const express = require("express");
const dotenv = require("dotenv");
const moment = require("moment");
const _ = require("lodash");

// Load env variables
dotenv.config({ path: "./config/config.env" });

const app = express();

// Configuring Airtable
var Airtable = require("airtable");
Airtable.configure({
  endpointUrl: "https://api.airtable.com",
  apiKey: `${process.env.AIRTABLE_KEY}`,
});
var base = Airtable.base("appvnq3LlzxDIHTqI");

// Get all classes for a particular student from classes base
app.get("/api/v1/classes/:studentID", (req, res) => {
  let formattedClasses = [];
  // Getting today's date & time for comparision
  const today = new Date();

  base("Classes")
    .select({
      // Selecting the first 3 records in Grid view:
      maxRecords: 100,
      view: "Grid view",
      // filterByFormula: "AND({Students} = 'SAT English', {Name} != 'SAT English')",
    })
    .eachPage(
      function page(allClasses, fetchNextPage) {
        // This function (`page`) will get called for each page of allClasses.

        // Sorting the allClasses in decending order
        allClasses = _.sortBy(allClasses, function (singleClass) {
          return new Date(singleClass.fields["Class Time"]);
        }).reverse();

        allClasses.forEach(function (singleClass) {
          const momentdate = moment(singleClass.get("Class Time")).format("Do MMMM");
          let students = singleClass.get("Students");
          let classStatus = undefined;

          if (moment(singleClass.get("Class Time")).isAfter(today)) {
            classStatus = "Upcoming";
          } else {
            classStatus = "Completed";
            // TODO Add logic for missed and attended classes after attendance logic is done on airtable
            // Get students from students attended column then check if the student exists there if yes "completed" if not then "missed"
          }

          // Checking if the student is included for the class
          if (students.includes(req.params.studentID)) {
            // console.log(
            // singleClass.get("Name"),
            // singleClass.get("Students")
            // singleClass.get("Class Time"),
            // singleClass.get("Topics")
            // momentdate
            // classStatus
            // );

            const formattedSingleClass = {
              className: singleClass.get("Name"),
              teacherName: singleClass.get("Teacher Name"),
              // classTime: singleClass.get("Class Time"),
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
        res.status(200).json({
          success: true,
          msg: `This gets all the classes`,
          classes: formattedClasses,
        });
        if (err) {
          console.error(err);
          return;
        }
      }
    );
});

// Get all classes for a student from the students base
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
  base("Students").find("recNqi8ePXFq9PPwj", function (err, record) {
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

        if (moment(singleClass.get("Class Time")).isAfter(today)) {
          classStatus = "Upcoming";
        } else {
          classStatus = "Completed";
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
          // classTime: singleClass.get("Class Time"),
          formattedTime: momentdate,
          classTopics: singleClass.get("Topics"),
          classStatus,
        };

        formattedClasses.push(formattedSingleClass);

        classesProcessed++;

        if (classesProcessed == studentClasses.length) {
          console.log("sending response");
          res.status(200).json({
            success: true,
            msg: `This gets all the classes`,
            classes: formattedClasses,
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

const PORT = process.env.PORT || 5000;

app.listen(PORT, console.log(`Server running in ${process.env.NODE_ENV} mode on port ${PORT}`));
