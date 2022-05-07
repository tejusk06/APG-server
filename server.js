const express = require("express");
const dotenv = require("dotenv");

// Load env variables
dotenv.config({ path: "./config/config.env" });

const app = express();
// ${process.env.AIRTABLE_KEY}

// Configuring Airtable
var Airtable = require("airtable");
Airtable.configure({
  endpointUrl: "https://api.airtable.com",
  apiKey: `${process.env.AIRTABLE_KEY}`,
});
var base = Airtable.base("appvnq3LlzxDIHTqI");

// Get class for a
app.get("/api/v1/classes/", (req, res) => {
  base("Classes")
    .select({
      // Selecting the first 3 records in Grid view:
      maxRecords: 10,
      view: "Grid view",
    })
    .eachPage(
      function page(records, fetchNextPage) {
        // This function (`page`) will get called for each page of records.

        console.log(records);

        res.status(200).json({
          success: true,
          msg: ` This gets all the classes for ${req.params.studentId}`,
          classes: records,
        });

        records.forEach(function (record) {
          console.log("Retrieved", record.get("Name"));
        });

        // To fetch the next page of records, call `fetchNextPage`.
        // If there are more records, `page` will get called again.
        // If there are no more records, `done` will get called.
        fetchNextPage();
      },
      function done(err) {
        console.log("done called");
        if (err) {
          console.error(err);
          return;
        }
      }
    );
});

// Update a class for student
/*
app.put("/api/v1/classes/:studentId", (req, res) => {
  res.status(200).json({ success: true, msg: `${req.params.studentId}` });
});
*/

// Route to create records
/*
app.post("/api/v1/classes/:studentId", (req, res) => {
  res.status(200).json({ success: true, msg: `${req.params.studentId}` });
});
*/

const PORT = process.env.PORT || 5000;

app.listen(PORT, console.log(`Server running in ${process.env.NODE_ENV} mode on port ${PORT}`));
