//module.exports.handler = () => {
const { AIRTABLE_API_KEY } = require("./config.js");
const practice_logs = require("./insertPractices");
const base = require("airtable").base("appQHyg8VRIOEuor7");
const timezone = "Australia/Sydney";

//Set up the dates that we need to find the practices due today
const moment = require("moment-timezone");
const date = moment().tz(timezone);
const week = () => {
  return date.week() % 2 ? 2 : 1;
};
const dayOfWeek = date.day(date.day()).format("ddd");
const dateFormattedForAirtable = date.format("YYYY-MM-DD");

let practicesToApply = [];

(async () => {
  try {
    const getReleventSchedules = await base("Schedules")
      .select({
        view: "All Schedules",
        filterByFormula: `{${dayOfWeek} - W${week()}}=1`
      })
      .eachPage(function page(records, fetchNextPage) {
        records.forEach(function(record) {
          if (record.get("Active Practices")) {
            practicesToApply = [
              ...practicesToApply,
              ...record.get("Active Practices")
            ];
          }
        });

        fetchNextPage();
      })
      .then(() => practicesToApply);
      
      practice_logs.insert(practicesToApply, dateFormattedForAirtable)



    console.log(getReleventSchedules);
  } catch (error) {
    console.error(error);
  }
})();

//};
