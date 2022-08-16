const express = require("express");
const dotenv = require("dotenv");
const moment = require("moment");
var cors = require("cors");
const _ = require("lodash");
const { type } = require("express/lib/response");

// Load env variables
dotenv.config({ path: "./config/config.env" });

const app = express();
app.use(cors());

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

//? Get all classes for a particular Student from classes base
app.get("/api/v1/classes/student/:studentCourse", (req, res) => {
  let formattedClasses = [];
  // Getting today's date & time for comparision
  const today = new Date();

  const studentID = req.params.studentCourse.split("-")[0];
  const courseID = req.params.studentCourse.split("-")[1];

  base("Classes")
    .select({
      // Selecting the first 500 records in Grid view:
      maxRecords: 500,
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
      ],

      filterByFormula: `({CourseID} = '${courseID}')`,
    })
    .eachPage(
      function page(allClasses, fetchNextPage) {
        // This function (`page`) will get called for each page of allClasses.
        // TODO Uncomment

        allClasses.forEach(function (singleClass) {
          let students = singleClass.get("Students");
          let studentsAttended = singleClass.get("Students Attended");
          let classStatus = null;

          // Checking is the class has any assigned students?

          // Checking if the student is included for the class
          if (students && students.includes(studentID)) {
            // console.log(
            // singleClass.get("Class Name")
            // singleClass.get("Course")[0]
            // singleClass.get("Class Completed")
            // singleClass.get("Students")
            // singleClass.get("Class Time"),
            // singleClass.get("Topics")
            // momentdate
            // classStatus
            // studentsAttended
            // );

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
              // TODO Uncomment

              className: singleClass.get("Name"),
              teacherName: singleClass.get("Teacher Name"),
              classTime: singleClass.get("Class Time"),
              formattedTime: momentdate,
              classTopics: singleClass.get("Topics"),
              classID: singleClass.get("ClassID"),
              zoomLink: singleClass.get("Zoom Link"),
              zoomRecording: singleClass.get("Zoom Recording"),
              classStatus,
              location: singleClass.get("Location"),
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

//? Get all classes from classes base for Admin
app.get("/api/v1/classes/admin", (req, res) => {
  let formattedClasses = [];
  // Getting today's date & time for comparision
  const today = new Date();

  base("Classes")
    .select({
      // Selecting the first 300 records in Grid view:
      maxRecords: 500,
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
      ],
    })
    .eachPage(
      function page(allClasses, fetchNextPage) {
        // This function (`page`) will get called for each page of allClasses.

        allClasses.forEach(function (singleClass) {
          let classStatus = null;

          // Checking if the student is included for the class

          console.log(
            singleClass.get("Class Name")
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
            classStatus = "Completed";
          } else {
            classStatus = "Upcoming";
          }

          const momentdate = moment(singleClass.get("Class Time")).add(330, "minutes").format("Do MMMM YY, h:mm a");

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

        const upcomingSorted = upcomingClasses.sort(function compare(a, b) {
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
        });
        if (err) {
          console.error(err);
          return;
        }
      }
    );
});

//? Get all topics for a particular Student from classes base
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
      completedTopics: completedTopics ? completedTopics : [],
    });
  });
});

//? Get all Homework for a particular Student from Homework base
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
      fields: ["Topic Name", "Due Date", "Completed", "Homework Files", "TopicID", "HomeworkID"],
      filterByFormula: `({StudentID} = '${studentID}')`,
    })
    .eachPage(
      function page(records, fetchNextPage) {
        // This function (`page`) will get called for each page of records.

        console.log(records);

        records.forEach(function (record) {
          var attachment = record.get(["Homework Files"]);
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
            name: record.get("Topic Name") ? record.get("Topic Name")[0] : "",
            topicId: record.get("TopicID") ? record.get("TopicID")[0] : "",
            homeworkId: record.get("HomeworkID"),
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

//? Get all Tests for a particular Student from Student Tests base
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
      fields: [
        "Test Name",
        "Test Due Date",
        "Test Report",
        "Status",
        "Question Paper",
        "TestID",
        "Answer Explanation",
        "Video Explanations",
      ],
      filterByFormula: `({StudentID} = '${studentID}')`,
    })
    .eachPage(
      function page(records, fetchNextPage) {
        // This function (`page`) will get called for each page of records.

        records.forEach(function (record) {
          let testItem = {
            name: record.get("Test Name") ? record.get("Test Name")[0] : "",
            dueDate: record.get("Test Due Date") ? record.get("Test Due Date") : null,
            momentDate: record.get("Test Due Date") ? moment(record.get("Test Due Date")).format("Do MMM YYYY") : null,
            report: record.get("Test Report") ? record.get("Test Report")[0].url : null,
            status: record.get("Status") ? record.get("Status") : false,
            questionPaper: record.get("Question Paper") ? record.get("Question Paper")[0].url : "",
            writtenExplanation: record.get("Answer Explanation") ? record.get("Answer Explanation")[0].url : "",
            videoExplanation: record.get("Video Explanations") ? record.get("Video Explanations")[0] : "",
            testId: record.get("TestID"),
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
          return singleTest.name;
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
      ],
      filterByFormula: `({TeacherID} = '${teacherID}')`,
    })
    .eachPage(
      function page(allClasses, fetchNextPage) {
        // This function (`page`) will get called for each page of allClasses.

        allClasses.forEach(function (singleClass) {
          let classStatus = null;

          // Checking if the student is included for the class

          console
            .log
            // singleClass.get("Name"),
            // singleClass.get("Class Completed")
            // singleClass.get("Class Time"),
            // singleClass.get("Topics")
            // singleClass.get("Student Names")
            // momentdate
            // classStatus
            ();

          // Marking class status for the student based on attendance marked
          if (singleClass.get("Class Completed")) {
            // Checking if any students attendance has been marked
            classStatus = "Completed";
          } else {
            classStatus = "Upcoming";
          }

          const momentdate = moment(singleClass.get("Class Time")).add(330, "minutes").format("Do MMMM YY, h:mm a");

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

        const upcomingSorted = upcomingClasses.sort(function compare(a, b) {
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
          msg: `This gets all the classes`,
          // formattedClasses,
          upcomingClasses: upcomingSorted,
          completedClasses: completedSorted,
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

//? Get individual class from classes base for both teacher and admin
app.get("/api/v1/class/:classID", (req, res) => {
  const classID = req.params.classID;
  // Getting today's date & time for comparision

  base("Classes").find(`${classID}`, function (err, record) {
    if (err) {
      console.error(err);
      return;
    }

    res.status(200).json({
      success: true,
      msg: `This gets the individual class`,
      // class: record,
      className: record.fields["Class Name"],
      classLocation: record.fields["Location"],
      teacherName: record.fields["Teacher Name"],
      topicsCompleted: record.fields["Topic Completed"],
      momentDate: moment(record.fields["Class Time"]).add(330, "minutes").format("Do MMMM, h:mm a"),
      zoomLink: record.fields["Zoom Link"],
      zoomRecording: record.fields["Zoom Recording"],
    });

    // console.log("Retrieved", record);
  });
});

//? Get all students from the students database for Admin
app.get("/api/v1/admin/students", (req, res) => {
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
      ],
    })
    .eachPage(
      function page(records, fetchNextPage) {
        // This function (`page`) will get called for each page of records.

        records.forEach(function (record) {
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
          console.log("Retrieved", record.get("Name"));

          allStudents.push(singleStudent);
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
          msg: `This gets all the students`,
          allStudents,
        });
      }
    );
});

//? Get all students from the students database for Coordinator
app.get("/api/v1/coordinator/students/:coordinatorID", (req, res) => {
  let allStudents = [];

  base("Students")
    .select({
      // Selecting the first 3 records in Grid view:
      maxRecords: 400,
      view: "Grid view",
      fields: [
        "Name",
        "Location",
        "Student Image",
        "Total Classes",
        "Total Tests",
        "Total Homework",
        "Total Topics Completed",
        "StudentID",
        "CourseID",
        "Coordinators",
      ],
    })
    .eachPage(
      function page(records, fetchNextPage) {
        // This function (`page`) will get called for each page of records.

        records.forEach(function (record) {
          if (record.get("Coordinators")) {
            if (record.get("Coordinators").includes(req.params.coordinatorID)) {
              let singleStudent = {
                name: record.get("Name"),
                location: record.get("Location"),
                image: record.get("Student Image") ? record.get("Student Image")[0].url : null,
                classes: record.get("Total Classes"),
                tests: record.get("Total Tests"),
                homework: record.get("Total Homework"),
                topics: record.get("Total Topics Completed"),
                studentID: record.get("StudentID"),
                courseID: record.get("CourseID") ? record.get("CourseID")[0] : "",
              };
              console.log("Retrieved", record.get("Name"));

              allStudents.push(singleStudent);
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
          msg: `This gets all the students`,
          allStudents,
        });
      }
    );
});

//? Get individual student from the students database for Admin
app.get("/api/v1/admin/student/:studentID", (req, res) => {
  const studentID = req.params.studentID;

  base("Students").find(`${studentID}`, function (err, record) {
    if (err) {
      console.error(err);
      return;
    }

    res.status(200).json({
      success: true,
      msg: `This gets all the students`,
      student: {
        name: record.get("Name"),
        email: record.get("Email Id"),
        image: record.get("Student Image") ? record.get("Student Image")[0].url : null,
        id: record.get("StudentID"),
        courseID: record.get("CourseID") ? record.get("CourseID")[0] : "",
      },
    });
  });
});

//? Get dashboard statistics for Admin
app.get("/api/v1/admin/dashboard", (req, res) => {
  let totalStudents = 0;
  let upcomingClasses = 0;
  let completedClasses = 0;

  const getClasses = () => {
    base("Classes")
      .select({
        // Selecting the first 3 records in Grid view:
        maxRecords: 1000,
        view: "All Classes",
        fields: ["Class Time", "Class Completed"],
      })
      .eachPage(
        function page(records, fetchNextPage) {
          // This function (`page`) will get called for each page of records.

          records.forEach(function (record) {
            if (record.get("Class Completed")) {
              completedClasses++;
            } else {
              upcomingClasses++;
            }
          });

          fetchNextPage();
        },
        function done(err) {
          if (err) {
            console.error(err);
            return;
          }

          res.status(200).json({
            success: true,
            msg: `This gets dashboard statistics for the admin`,
            stats: {
              totalStudents,
              upcomingClasses,
              completedClasses,
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
        fields: ["Name"],
      })
      .eachPage(
        function page(records, fetchNextPage) {
          totalStudents = totalStudents + records.length;

          records.forEach((record, index) => {
            console.log(index, record.get("Name"));
          });
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

//? Get dashboard statistics for Student
app.get("/api/v1/student/dashboard/:studentID", (req, res) => {
  let upcomingClasses = 0;
  let completedClasses = 0;
  let allClasses = 0;
  let allHomework = [];
  let homeworkPending = 0;
  let homeworkDue = 0;
  let homeworkCompleted = 0;
  let testsUpcoming = 0;
  let testsMissed = 0;
  let testsCompleted = 0;

  base("Students").find(req.params.studentID, function (err, record) {
    if (err) {
      console.error(err);
      return;
    }
    // console.log("Retrieved", record.fields);

    // Logic for classes stats
    const classesDone = record.get("Classes Completed");
    if (classesDone) {
      classesDone.forEach((eachClass) => {
        allClasses++;
        if (eachClass) {
          completedClasses++;
        }
      });
    }

    upcomingClasses = allClasses - completedClasses;

    // Logic for homework Stats
    const homeworkStatusArray = record.get("Homework Completed") ? record.get("Homework Completed").split(",") : [];
    const homeworkDatesArray = record.get("Homework Due Date") ? record.get("Homework Due Date") : [];

    for (let i = 0; i < homeworkDatesArray.length; i++) {
      if (homeworkStatusArray[i]) {
        homeworkCompleted++;
      } else {
        const homeworkDate = homeworkDatesArray[i];
        const isPast = dateInPast(new Date(homeworkDate).addDays(1));

        if (isPast) {
          homeworkDue++;
        } else {
          homeworkPending++;
        }
      }
    }

    // Logic for tests stats
    const testsDatesArray = record.get("Test Due Dates");
    if (record.get("Test Status")) {
      const testStatusArray = record.get("Test Status").split(",");
      for (let i = 0; i < testsDatesArray.length; i++) {
        if (testStatusArray[i]) {
          testsCompleted++;
        } else {
          const testDate = testsDatesArray[i];
          const isPast = dateInPast(new Date(testDate).addDays(1));

          if (isPast) {
            testsMissed++;
          } else {
            testsUpcoming++;
          }
        }
      }
    }

    res.status(200).json({
      success: true,
      msg: `This gets dashboard statistics for the student`,
      stats: {
        upcomingClasses,
        allClasses,
        totalTopicsCompleted: record.get("Total Topics Completed"),
        mathTopicsCompleted: record.get("Sat Math Topics Completed"),
        readingTopicsCompleted: record.get("Sat Reading Topics Completed"),
        writingTopicsCompleted: record.get("Sat Writing Topics Completed"),
        homeworkPending,
        homeworkDue,
        homeworkCompleted,
        testsUpcoming,
        testsMissed,
        testsCompleted,
      },
    });
  });
});

//? Get dashboard statistics for Student V2
app.get("/api/v1/student/dashboard-v2/:studentCourse", (req, res) => {
  const studentID = req.params.studentCourse.split("-")[0];
  const courseID = req.params.studentCourse.split("-")[1];

  let formattedClasses = [];
  // Getting today's date & time for comparision
  const today = new Date();

  // Variables for dashboard statistics
  let gotDashboardDetails = false;
  let upcomingClassesCount = 0;
  let completedClassesCount = 0;
  let allClasses = 0;
  let allHomework = [];
  let homeworkPending = 0;
  let homeworkDue = 0;
  let homeworkCompleted = 0;
  let testsUpcoming = 0;
  let testsMissed = 0;
  let testsCompleted = 0;
  let totalTopicsCompleted = 0;
  let satMathTopicsCompleted = 0;
  let satReadingTopicsCompleted = 0;
  let satWritingTopicsCompleted = 0;
  let actReadingTopicsCompleted = 0;
  let actScienceTopicsCompleted = 0;
  let actEnglishTopicsCompleted = 0;

  // Varibles for student classes
  let gotClassesDetails = false;
  let upcomingClasses = [];
  let completedClasses = [];
  let missedClasses = [];
  let unknownClasses = [];

  // Varibles for student topics
  let completedTopics = [];

  // Variables for student Homework
  let gotHomeworkDetails = false;
  let homeworkArray = [];

  // Variable for student tests
  let gotTestDetails = false;
  let testsArray = [];

  //? Gets dashboard statistics for the student
  base("Students").find(studentID, function (err, record) {
    if (err) {
      console.error(err);
      return;
    }
    // console.log("Retrieved", record.fields);

    // Logic for classes stats
    const classesDone = record.get("Classes Completed");
    if (classesDone) {
      classesDone.forEach((eachClass) => {
        allClasses++;
        if (eachClass) {
          completedClassesCount++;
        }
      });
    }

    upcomingClassesCount = allClasses - completedClassesCount;

    // Logic for homework Stats
    const homeworkStatusArray = record.get("Homework Completed") ? record.get("Homework Completed").split(",") : [];
    const homeworkDatesArray = record.get("Homework Due Date") ? record.get("Homework Due Date") : [];

    for (let i = 0; i < homeworkDatesArray.length; i++) {
      if (homeworkStatusArray[i]) {
        homeworkCompleted++;
      } else {
        const homeworkDate = homeworkDatesArray[i];
        const isPast = dateInPast(new Date(homeworkDate).addDays(1));

        if (isPast) {
          homeworkDue++;
        } else {
          homeworkPending++;
        }
      }
    }

    // Logic for tests stats
    const testsDatesArray = record.get("Test Due Dates");
    if (record.get("Test Status")) {
      const testStatusArray = record.get("Test Status").split(",");
      for (let i = 0; i < testsDatesArray.length; i++) {
        if (testStatusArray[i]) {
          testsCompleted++;
        } else {
          const testDate = testsDatesArray[i];
          const isPast = dateInPast(new Date(testDate).addDays(1));

          if (isPast) {
            testsMissed++;
          } else {
            testsUpcoming++;
          }
        }
      }
    }

    // Get the topics values
    totalTopicsCompleted = record.get("Total Topics Completed");
    satMathTopicsCompleted = record.get("Sat Math Topics Completed");
    satReadingTopicsCompleted = record.get("Sat Reading Topics Completed");
    satWritingTopicsCompleted = record.get("Sat Writing Topics Completed");
    completedTopics = record.get("Completed Topic IDs");

    gotDashboardDetails = true;
  });

  //? Gets all classes for the student
  base("Classes")
    .select({
      // Selecting the first 500 records in Grid view:
      maxRecords: 500,
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
      ],
      filterByFormula: `({CourseID} = '${courseID}')`,
    })
    .eachPage(
      function page(allClasses, fetchNextPage) {
        // This function (`page`) will get called for each page of allClasses.

        allClasses.forEach(function (singleClass) {
          let students = singleClass.get("Students");
          let studentsAttended = singleClass.get("Students Attended");
          let classStatus = null;

          // Checking if the student is included for the class
          if (students.includes(studentID)) {
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
              // className: singleClass.get("Name"),
              teacherName: singleClass.get("Teacher Name"),
              classTime: singleClass.get("Class Time"),
              formattedTime: momentdate,
              classTopics: singleClass.get("Topics"),
              classID: singleClass.get("ClassID"),
              zoomLink: singleClass.get("Zoom Link"),
              zoomRecording: singleClass.get("Zoom Recording"),
              classStatus,
              location: singleClass.get("Location"),
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
        // Getting all the upcoming classes
        upcomingClasses = formattedClasses.filter((eachClass) => {
          return eachClass.classStatus == "Upcoming";
        });

        // Sorting Upcoming classes in ascending order
        upcomingClasses.sort((d1, d2) => new Date(d1.formattedTime).getTime() - new Date(d2.formattedTime).getTime());

        completedClasses = formattedClasses.filter((eachClass) => {
          return eachClass.classStatus == "Completed";
        });

        // Sorting Completed classes in decending order
        completedClasses.sort((d1, d2) => new Date(d1.formattedTime).getTime() - new Date(d2.formattedTime).getTime())
          .reverse;

        // Getting all the missed classes
        missedClasses = formattedClasses.filter((eachClass) => {
          return eachClass.classStatus == "Missed";
        });

        // Sorting Missed classes in decending order
        missedClasses.sort((d1, d2) => new Date(d1.formattedTime).getTime() - new Date(d2.formattedTime).getTime())
          .reverse;

        // Getting all the unknown classes
        unknownClasses = formattedClasses.filter((eachClass) => {
          return eachClass.classStatus == "Unknown";
        });

        // Sorting Unknown classes in decending order
        unknownClasses.sort((d1, d2) => new Date(d1.formattedTime).getTime() - new Date(d2.formattedTime).getTime())
          .reverse;

        gotClassesDetails = true;

        if (err) {
          console.error(err);
          return;
        }
      }
    );

  //? Gets all homework for a student
  base("Homework")
    .select({
      // Selecting the first 3000 records in Grid view:
      maxRecords: 6000,
      view: "Grid view",
      fields: ["Topic Name", "Due Date", "Completed", "Homework Files", "TopicID", "HomeworkID"],
      filterByFormula: `({StudentID} = '${studentID}')`,
    })
    .eachPage(
      function page(records, fetchNextPage) {
        // This function (`page`) will get called for each page of records.

        records.forEach(function (record) {
          var attachment = record.get(["Homework Files"]);
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
            name: record.get("Topic Name") ? record.get("Topic Name")[0] : "",
            topicId: record.get("TopicID") ? record.get("TopicID")[0] : "",
            homeworkId: record.get("HomeworkID"),
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
        gotHomeworkDetails = true;

        if (err) {
          console.error(err);
          return;
        }
      }
    );

  //? Gets all the tests for a student
  base("Student Tests")
    .select({
      // Selecting the first 6000 records in Grid view:
      maxRecords: 10000,
      view: "Grid view",
      fields: [
        "Test Name",
        "Test Due Date",
        "Test Report",
        "Status",
        "Question Paper",
        "TestID",
        "Answer Explanation",
        "Video Explanations",
      ],
      filterByFormula: `({StudentID} = '${studentID}')`,
    })
    .eachPage(
      function page(records, fetchNextPage) {
        // This function (`page`) will get called for each page of records.

        records.forEach(function (record) {
          let testItem = {
            name: record.get("Test Name") ? record.get("Test Name")[0] : "",
            dueDate: record.get("Test Due Date") ? record.get("Test Due Date") : null,
            momentDate: record.get("Test Due Date") ? moment(record.get("Test Due Date")).format("Do MMM YYYY") : null,
            report: record.get("Test Report") ? record.get("Test Report")[0].url : null,
            status: record.get("Status") ? record.get("Status") : false,
            questionPaper: record.get("Question Paper") ? record.get("Question Paper")[0].url : "",
            writtenExplanation: record.get("Answer Explanation") ? record.get("Answer Explanation")[0].url : "",
            videoExplanation: record.get("Video Explanations") ? record.get("Video Explanations")[0] : "",
            testId: record.get("TestID"),
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
          return singleTest.name;
        });

        gotTestDetails = true;

        if (err) {
          console.error(err);
          return;
        }
      }
    );

  // Return response after all APIs have returned
  const allCLear = setInterval(() => {
    if (gotDashboardDetails && gotClassesDetails && gotHomeworkDetails && gotTestDetails) {
      res.status(200).json({
        success: true,
        msg: `This gets dashboard statistics for the student`,
        stats: {
          upcomingClassesCount,
          completedClassesCount,
          missedClassesCount: missedClasses.length,
          allClasses,
          homeworkPending,
          homeworkDue,
          homeworkCompleted,
          testsUpcoming,
          testsMissed,
          testsCompleted,
          totalTopicsCompleted,
          satMathTopicsCompleted,
          satReadingTopicsCompleted,
          satWritingTopicsCompleted,
          actReadingTopicsCompleted,
          actScienceTopicsCompleted,
          actEnglishTopicsCompleted,
        },

        classes: {
          upcomingClasses,
          completedClasses,
          missedClasses,
          unknownClasses,
        },

        completedTopics,

        homeworkArray,

        testsArray,
      });
      clearInterval(allCLear);
    }
  }, 200);
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, console.log(`Server running in ${process.env.NODE_ENV} mode on port ${PORT}`));

// testing heroku setup
