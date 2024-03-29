const express = require("express");
const router = express.Router();
const dotenv = require("dotenv");
const moment = require("moment");
const _ = require("lodash");

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

//? Get dashboard statistics for Student V2
router.get("/:studentCourse", (req, res) => {
  const studentID = req.params.studentCourse ? req.params.studentCourse.split("-")[0] : "";
  const courseID = req.params.studentCourse ? req.params.studentCourse.split("-")[1] : "";

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
    try {
      if (err) {
        console.error(err);
        return;
      }

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

      actReadingTopicsCompleted = record.get("Act Reading Topics Completed");
      actScienceTopicsCompleted = record.get("Act Science Topics Completed");
      actEnglishTopicsCompleted = record.get("Act English Topics Completed");

      completedTopics = record.get("Completed Topic IDs");

      gotDashboardDetails = true;
    } catch (error) {
      console.log("error is", error);

      res.status(500).json({
        success: false,
        error: `${error}`,
      });
    }
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

        try {
          allClasses.forEach(function (singleClass) {
            let students = singleClass.get("Students");
            let studentsAttended = singleClass.get("Students Attended");
            let classStatus = null;

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
        try {
          records.forEach(function (record) {
            var attachment = record.get(["Homework Files"]);
            if (!attachment) {
              attachment = null;
            }

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

        try {
          records.forEach(function (record) {
            let testItem = {
              name: record.get("Test Name") ? record.get("Test Name")[0] : "",
              dueDate: record.get("Test Due Date") ? record.get("Test Due Date") : null,
              momentDate: record.get("Test Due Date")
                ? moment(record.get("Test Due Date")).format("Do MMM YYYY")
                : null,
              report: record.get("Test Report") ? record.get("Test Report")[0].url : null,
              status: record.get("Status") ? record.get("Status") : false,
              questionPaper: record.get("Question Paper") ? record.get("Question Paper")[0].url : "",
              writtenExplanation: record.get("Answer Explanation") ? record.get("Answer Explanation")[0].url : "",
              videoExplanation: record.get("Video Explanations") ? record.get("Video Explanations")[0] : "",
              testId: record.get("TestID"),
            };
            testsArray.push(testItem);
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

module.exports = router;
