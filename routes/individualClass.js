const express = require("express");
const router = express.Router();
const dotenv = require("dotenv");
const moment = require("moment");

// Load env variables
dotenv.config({ path: "./config/config.env" });

// Creating the base for Airtable API Calls
const base = require("airtable").base("appvnq3LlzxDIHTqI");

//? Get individual class from classes base for both teacher and admin
router.get("/:classID", (req, res) => {
  const classID = req.params.classID;
  // Getting today's date & time for comparision

  base("Classes").find(`${classID}`, function (err, record) {
    if (err) {
      console.error(err);

      res.status(500).json({
        success: false,
        error: err,
      });
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
  });
});

module.exports = router;
