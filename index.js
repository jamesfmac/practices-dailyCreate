//module.exports.handler = () => {
const { AIRTABLE_API_KEY } = require("./config.js");
const { insert, getPracticesByDate } = require("./practicesLogs");
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

const compareExpectedAgainstExisting = async (expected, existing) => {
  const finalarr = [];

  expected.forEach(x => {
    if (existing.includes(x)) {
      finalarr.push(x);
    }
  });
  return finalarr
};

let practicesToApply = [];

(async () => {
  try {
    //these could be done  in parallel to speed things up
    const existingPractices = await getPracticesByDate(
      dateFormattedForAirtable
    );
    const expectedPractices = await base("Schedules")
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

    //compare existing to expected and create the missing ones
    console.log(expectedPractices);
    console.log(existingPractices.length);

    const practicesToCreate = await compareExpectedAgainstExisting(
      expectedPractices,
      existingPractices
    );
    console.log(practicesToCreate);

    insert(practicesToApply, dateFormattedForAirtable);
  } catch (error) {
    console.error(error);
  }
})();

//};
