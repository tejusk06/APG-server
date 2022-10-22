const express = require("express");
const dotenv = require("dotenv");
const moment = require("moment");
var cors = require("cors");
const _ = require("lodash");
const { type } = require("express/lib/response");

// Route Files
const studentClasses = require("./routes/studentClasses.js");
const coordinatorAdminClasses = require("./routes/coordinatorAdminClasses.js");
const studentTopics = require("./routes/studentTopics.js");
const studentHomework = require("./routes/studentHomework");
const studentTests = require("./routes/studentTests");
const teacherClasses = require("./routes/teacherClasses");
const individualClass = require("./routes/individualClass");
const coordinatorAdminStudents = require("./routes/coordinatorAdminStudents");
const individualStudent = require("./routes/individualStudent");
const coordinatorAdminDashboard = require("./routes/coordinatorAdminDashboard");
const studentDashboard = require("./routes/studentDashboard");

// Load env variables
dotenv.config({ path: "./config/config.env" });

const app = express();
app.use(cors());

// Mount routers
app.use("/api/v1/classes/student", studentClasses);
app.use("/api/v1/coordinatorAdmin/classes", coordinatorAdminClasses);
app.use("/api/v1/topics/student", studentTopics);
app.use("/api/v1/homework/student", studentHomework);
app.use("/api/v1/tests/student", studentTests);
app.use("/api/v1/classes/teacher", teacherClasses);
app.use("/api/v1/class", individualClass);
app.use("/api/v1/coordinatorAdmin/students", coordinatorAdminStudents);
app.use("/api/v1/admin/student", individualStudent);
app.use("/api/v1/coordinatorAdmin/dashboard", coordinatorAdminDashboard);
app.use("/api/v1/student/dashboard", studentDashboard);

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

//? Get all students from the students database for Admin - Limit 1000
// TODO this api call is not being used
// app.get("/api/v1/admin/students", (req, res) => {
//   let allStudents = [];

//   base("Students")
//     .select({
//       // Selecting the first 3 records in Grid view:
//       maxRecords: 1000,
//       view: "Grid view",
//       fields: [
//         "Name",
//         "Location",
//         "Student Image",
//         "Total Classes",
//         "Classes Attended",
//         "Total Tests",
//         "Test Due Dates",
//         "Total Homework",
//         "Homework Completed",
//         "Homework Due Date",
//         "Total Topics Completed",
//         "StudentID",
//         "CourseID",
//         "Test Status",
//       ],
//     })
//     .eachPage(
//       function page(records, fetchNextPage) {
//         // This function (`page`) will get called for each page of records.

//         records.forEach(function (record) {
//           let testsCompleted = 0;
//           let testsUpcoming = 0;

//           let homeworkCompleted = 0;
//           let homeworkPending = 0;

//           let classesAttended = 0;

//           const testsDatesArray = record.get("Test Due Dates");

//           if (record.get("Test Status")) {
//             const testStatusArray = record.get("Test Status").split(",");
//             for (let i = 0; i < testsDatesArray.length; i++) {
//               if (testStatusArray[i]) {
//                 testsCompleted++;
//               } else {
//                 const testDate = testsDatesArray[i];
//                 const isPast = dateInPast(new Date(testDate).addDays(1));
//                 if (!isPast) {
//                   testsUpcoming++;
//                 }
//               }
//             }
//           }

//           // Logic for homework Stats

//           const homeworkStatusArray = record.get("Homework Completed")
//             ? record.get("Homework Completed").split(",")
//             : [];
//           const homeworkDatesArray = record.get("Homework Due Date") ? record.get("Homework Due Date") : [];

//           for (let i = 0; i < homeworkDatesArray.length; i++) {
//             if (homeworkStatusArray[i]) {
//               homeworkCompleted++;
//             } else {
//               const homeworkDate = homeworkDatesArray[i];
//               const isPast = dateInPast(new Date(homeworkDate).addDays(1));

//               if (!isPast) {
//                 homeworkPending++;
//               }
//             }
//           }

//           if (record.get("Classes Attended")) {
//             classesAttended = record.get("Classes Attended").length;
//           }

//           let singleStudent = {
//             name: record.get("Name"),
//             location: record.get("Location"),
//             image: record.get("Student Image") ? record.get("Student Image")[0].url : null,
//             classes: record.get("Total Classes"),
//             classesAttended: classesAttended,
//             tests: record.get("Total Tests"),
//             testsCompleted: testsCompleted,
//             testsUpcoming: testsUpcoming,
//             homework: record.get("Total Homework"),
//             homeworkCompleted: homeworkCompleted,
//             homeworkPending: homeworkPending,
//             topics: record.get("Total Topics Completed"),
//             studentID: record.get("StudentID"),
//             courseID: record.get("CourseID") ? record.get("CourseID")[0] : "",
//           };

//           allStudents.push(singleStudent);
//         });

//         // To fetch the next page of records, call `fetchNextPage`.
//         // If there are more records, `page` will get called again.
//         // If there are no more records, `done` will get called.
//         fetchNextPage();
//       },
//       function done(err) {
//         if (err) {
//           console.error(err);
//           return;
//         }

//         res.status(200).json({
//           success: true,
//           msg: `This gets all the students`,
//           allStudents,
//         });
//       }
//     );
// });

//? Get dashboard statistics for Student
// TODO this api call is not being used
// app.get("/api/v1/student/dashboard/:studentID", (req, res) => {
//   let upcomingClasses = 0;
//   let completedClasses = 0;
//   let allClasses = 0;
//   let allHomework = [];
//   let homeworkPending = 0;
//   let homeworkDue = 0;
//   let homeworkCompleted = 0;
//   let testsUpcoming = 0;
//   let testsMissed = 0;
//   let testsCompleted = 0;

//   base("Students").find(req.params.studentID, function (err, record) {
//     if (err) {
//       console.error(err);
//       return;
//     }

//     // Logic for classes stats
//     const classesDone = record.get("Classes Completed");
//     if (classesDone) {
//       classesDone.forEach((eachClass) => {
//         allClasses++;
//         if (eachClass) {
//           completedClasses++;
//         }
//       });
//     }

//     upcomingClasses = allClasses - completedClasses;

//     // Logic for homework Stats
//     const homeworkStatusArray = record.get("Homework Completed") ? record.get("Homework Completed").split(",") : [];
//     const homeworkDatesArray = record.get("Homework Due Date") ? record.get("Homework Due Date") : [];

//     for (let i = 0; i < homeworkDatesArray.length; i++) {
//       if (homeworkStatusArray[i]) {
//         homeworkCompleted++;
//       } else {
//         const homeworkDate = homeworkDatesArray[i];
//         const isPast = dateInPast(new Date(homeworkDate).addDays(1));

//         if (isPast) {
//           homeworkDue++;
//         } else {
//           homeworkPending++;
//         }
//       }
//     }

//     // Logic for tests stats
//     const testsDatesArray = record.get("Test Due Dates");
//     if (record.get("Test Status")) {
//       const testStatusArray = record.get("Test Status").split(",");
//       for (let i = 0; i < testsDatesArray.length; i++) {
//         if (testStatusArray[i]) {
//           testsCompleted++;
//         } else {
//           const testDate = testsDatesArray[i];
//           const isPast = dateInPast(new Date(testDate).addDays(1));

//           if (isPast) {
//             testsMissed++;
//           } else {
//             testsUpcoming++;
//           }
//         }
//       }
//     }

//     res.status(200).json({
//       success: true,
//       msg: `This gets dashboard statistics for the student`,
//       stats: {
//         upcomingClasses,
//         allClasses,
//         totalTopicsCompleted: record.get("Total Topics Completed"),
//         mathTopicsCompleted: record.get("Sat Math Topics Completed"),
//         readingTopicsCompleted: record.get("Sat Reading Topics Completed"),
//         writingTopicsCompleted: record.get("Sat Writing Topics Completed"),
//         homeworkPending,
//         homeworkDue,
//         homeworkCompleted,
//         testsUpcoming,
//         testsMissed,
//         testsCompleted,
//       },
//     });
//   });
// });

const PORT = process.env.PORT || 5000;

app.listen(PORT, console.log(`Server running in ${process.env.NODE_ENV} mode on port ${PORT}`));

// testing heroku setup
