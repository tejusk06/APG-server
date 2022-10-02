const express = require("express");
const router = express.Router();
const dotenv = require("dotenv");
const moment = require("moment");

// Load env variables
dotenv.config({ path: "./config/config.env" });

// Creating the base for Airtable API Calls
const base = require("airtable").base("appvnq3LlzxDIHTqI");

//? Get all Homework for a particular Student from Homework base - Limit 100
router.get("/:studentID", (req, res) => {
  // Getting today's date & time for comparision
  let homeworkArray = [];
  const today = new Date();

  const studentID = req.params.studentID;

  // Function to mark topics completed as true or false - this is called after all the topics are retrived
  base("Homework")
    .select({
      // Selecting the first 100 records in Grid view:
      maxRecords: 100,
      view: "Grid view",
      fields: [
        "Topic Name",
        "Due Date",
        "Completed",
        "Homework Files",
        "TopicID",
        "HomeworkID",
        "Course Section",
        "Course Section Homework Name",
        "Homework Assigned",
        "Homework Completed",
      ],
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

          let homeworkCompleted = false;
          if (record.get("Completed")) {
            homeworkCompleted = true;
          }

          let homeworkItem = {
            name: record.get("Topic Name") ? record.get("Topic Name")[0] : "",
            topicId: record.get("TopicID") ? record.get("TopicID")[0] : "",
            homeworkId: record.get("HomeworkID"),
            date: record.get("Due Date"),
            assignedDate: moment(record.get("Homework Assigned")).format("Do MMM"),
            completedDate: moment(record.get("Homework Completed")).format("Do MMM"),
            completed: homeworkCompleted,
            attachment: attachment ? attachment[0].url : attachment,
            momentDate: moment(record.get("Due Date")).format("Do MMM"),
            courseSection: record.get("Course Section")[0],
            courseSectionHomeworkName: record.get("Course Section Homework Name"),
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

module.exports = router;
