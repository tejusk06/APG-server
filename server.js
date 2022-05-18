const express = require("express");
const dotenv = require("dotenv");
const moment = require("moment");
var cors = require("cors");
const _ = require("lodash");

// Load env variables
dotenv.config({ path: "./config/config.env" });

const app = express();
app.use(cors());

const base = require("airtable").base("appvnq3LlzxDIHTqI");

//? Get all classes for a particular student from classes base
app.get("/api/v1/classes/student/:studentCourse", (req, res) => {
  let formattedClasses = [];
  // Getting today's date & time for comparision
  const today = new Date();

  const studentID = req.params.studentCourse.split("-")[0];
  const courseID = req.params.studentCourse.split("-")[1];

  base("Classes")
    .select({
      // Selecting the first 300 records in Grid view:
      maxRecords: 300,
      view: "Grid view",
      fields: [
        "Name",
        "CourseID",
        "Teacher Name",
        "Class Time",
        "Topics",
        "Students",
        "Students Attended",
        "Class Completed",
      ],
      filterByFormula: `({CourseID} = '${courseID}')`,
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
          if (students.includes(studentID)) {
            console.log(
              singleClass.get("Name")
              // singleClass.get("Course")[0]
              // singleClass.get("Class Completed")
              // singleClass.get("Students")
              // singleClass.get("Class Time"),
              // singleClass.get("Topics")
              // momentdate
              // classStatus
              // studentsAttended
            );

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
        unknownClasses.sort((d1, d2) => new Date(d1.formattedTime).getTime() - new Date(d2.formattedTime).getTime())
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

//? Get all topics for a particular student from classes base
app.get("/api/v1/topics/student/:studentCourse", (req, res) => {
  // Getting today's date & time for comparision
  const today = new Date();

  const studentID = req.params.studentCourse.split("-")[0];
  const courseID = req.params.studentCourse.split("-")[1];

  // Function to mark topics completed as true or false - this is called after all the topics are retrived
  base("Students").find(`${studentID}`, function (err, record) {
    if (err) {
      console.error(err);
      return;
    }

    const completedTopics = record.get("Completed Topic IDs");

    console.log("Topics are", completedTopics);

    // Send all formatted topics as response
    res.status(200).json({
      success: true,
      msg: `This gets all the topics for a student`,
      completedTopics,
    });
  });
});

//? Get all Homework for a particular student from Homework base
app.get("/api/v1/homework/student/:studentID", (req, res) => {
  // Getting today's date & time for comparision
  let homeworkArray = [];
  const today = new Date();

  const studentID = req.params.studentID;

  // Function to mark topics completed as true or false - this is called after all the topics are retrived
  base("Homework")
    .select({
      // Selecting the first 3000 records in Grid view:
      maxRecords: 6000,
      view: "Grid view",
      fields: ["Topic Name", "Due Date", "Completed", "Attachment", "TopicID"],
      filterByFormula: `({StudentID} = '${studentID}')`,
    })
    .eachPage(
      function page(records, fetchNextPage) {
        // This function (`page`) will get called for each page of records.

        records.forEach(function (record) {
          var attachment = record.get(["Attachment"]);
          if (!attachment) {
            attachment = null;
          }
          // console.log("url", attachment);
          // console.log("Attachment", record.get("url"));
          let homeworkCompleted = false;
          if (record.get("Completed")) {
            homeworkCompleted = true;
          }

          let homeworkItem = {
            name: record.get("Topic Name")[0],
            topicId: record.get("TopicID")[0],
            date: record.get("Due Date"),
            completed: homeworkCompleted,
            attachment: attachment ? attachment[0].url : attachment,
            momentDate: moment(record.get("Due Date")).format("Do MMM"),
          };
          homeworkArray.push(homeworkItem);
        });

        // To fetch the next page of records, call `fetchNextPage`.
        // If there are more records, `page` will get called again.
        // If there are no more records, `done` will get called.
        fetchNextPage();
      },
      function done(err) {
        res.status(200).json({
          success: true,
          msg: `This gets all the homework for a student`,
          homeworkArray,
        });

        if (err) {
          console.error(err);
          return;
        }
      }
    );

  // Send all formatted topics as response
});

//? Get all Tests for a particular student from Student Tests base
app.get("/api/v1/tests/student/:studentID", (req, res) => {
  // Getting today's date & time for comparision
  let testsArray = [];
  const today = new Date();

  const studentID = req.params.studentID;

  base("Student Tests")
    .select({
      // Selecting the first 6000 records in Grid view:
      maxRecords: 10000,
      view: "Grid view",
      fields: ["Test Name", "Test Due Date", "Test Report", "Status", "Question Paper"],
      filterByFormula: `({StudentID} = '${studentID}')`,
    })
    .eachPage(
      function page(records, fetchNextPage) {
        // This function (`page`) will get called for each page of records.

        records.forEach(function (record) {
          let testItem = {
            name: record.get("Test Name")[0],
            dueDate: record.get("Test Due Date"),
            momentDate: moment(record.get("Test Due Date")).format("Do MMM YYYY"),
            report: record.get("Test Report") ? record.get("Test Report")[0].url : null,
            status: record.get("Status") ? record.get("Status") : false,
            questionPaper: record.get("Question Paper")[0].url,
          };
          testsArray.push(testItem);
        });

        // To fetch the next page of records, call `fetchNextPage`.
        // If there are more records, `page` will get called again.
        // If there are no more records, `done` will get called.
        fetchNextPage();
      },
      function done(err) {
        // Sorting the allClasses in decending order
        testsArray = _.sortBy(testsArray, function (singleTest) {
          return new Date(singleTest.fields["name"]);
        });

        res.status(200).json({
          success: true,
          msg: `This gets all the tests for a student`,
          testsArray,
        });

        if (err) {
          console.error(err);
          return;
        }
      }
    );

  // Send all formatted topics as response
});

//? Get all classes for a particular teacher from classes base
app.get("/api/v1/classes/teacher/:teacherID", (req, res) => {
  let formattedClasses = [];
  // Getting today's date & time for comparision
  const today = new Date();
  const teacherID = req.params.teacherID;

  base("Classes")
    .select({
      // Selecting the first 300 records in Grid view:
      maxRecords: 300,
      view: "Grid view",
      fields: ["Name", "ClassID", "Teacher Name", "TeacherID", "Class Time", "Topics", "Class Completed"],
      filterByFormula: `({TeacherID} = '${teacherID}')`,
    })
    .eachPage(
      function page(allClasses, fetchNextPage) {
        // This function (`page`) will get called for each page of allClasses.

        // Sorting the allClasses in decending order
        // allClasses = _.sortBy(allClasses, function (singleClass) {
        //   return new Date(singleClass.fields["Class Time"]);
        // }).reverse();

        allClasses.forEach(function (singleClass) {
          let classStatus = null;

          // Checking if the student is included for the class

          // console.log(
          // singleClass.get("Name"),
          // singleClass.get("Class Completed")
          // singleClass.get("Class Time"),
          // singleClass.get("Topics")
          // momentdate
          // classStatus
          // );

          // Marking class status for the student based on attendance marked
          if (singleClass.get("Class Completed")) {
            // Checking if any students attendance has been marked
            classStatus = "Completed";
          } else {
            classStatus = "Upcoming";
          }

          const momentdate = moment(singleClass.get("Class Time")).add(330, "minutes").format("Do MMMM, h:mm a");

          const formattedSingleClass = {
            className: singleClass.get("Name"),
            teacherName: singleClass.get("Teacher Name"),
            classTime: singleClass.get("Class Time"),
            formattedTime: momentdate,
            classTopics: singleClass.get("Topics"),
            classID: singleClass.get("ClassID"),
            classStatus,
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
        // const missedClasses = formattedClasses.filter((eachClass) => {
        //   return eachClass.classStatus == "Missed";
        // });

        // Sorting Missed classes in decending order
        // missedClasses.sort((d1, d2) => new Date(d1.formattedTime).getTime() - new Date(d2.formattedTime).getTime())
        //   .reverse;

        // Getting all the unknown classes
        const unknownClasses = formattedClasses.filter((eachClass) => {
          return eachClass.classStatus == "Unknown";
        });

        // Sorting Unknown classes in decending order
        unknownClasses.sort((d1, d2) => new Date(d1.formattedTime).getTime() - new Date(d2.formattedTime).getTime())
          .reverse;

        res.status(200).json({
          success: true,
          msg: `This gets all the classes`,
          // formattedClasses,
          upcomingClasses,
          completedClasses,
          // missedClasses,
          unknownClasses,
        });
        if (err) {
          console.error(err);
          return;
        }
      }
    );
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, console.log(`Server running in ${process.env.NODE_ENV} mode on port ${PORT}`));

// testing heroku setup
