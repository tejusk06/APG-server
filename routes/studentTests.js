const express = require("express");
const router = express.Router();
const dotenv = require("dotenv");
const moment = require("moment");
const _ = require("lodash");

// Load env variables
dotenv.config({ path: "./config/config.env" });

// Creating the base for Airtable API Calls
const base = require("airtable").base("appvnq3LlzxDIHTqI");

//? Get all Tests for a particular Student from Student Tests base - Limit 100
router.get("/:studentID", (req, res) => {
  // Getting today's date & time for comparision
  let testsArray = [];
  const today = new Date();

  const studentID = req.params.studentID;

  base("Student Tests")
    .select({
      // Selecting the first 6000 records in Grid view:
      maxRecords: 100,
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

module.exports = router;
