const { db } = require("./getDatabase");
const date = require("date-and-time");

function saveHistory(phoneNumber, callback) {
  db.query(
    "SELECT name, session_data FROM users WHERE phone_number = ?",
    [phoneNumber],
    (err, results) => {
      var now = new Date();
      var datetime = date.format(now, "YYYY-MM-DD HH:mm:ss");

      if (err) throw err;
      if (results.length > 0) {
        const name = results[0].name;
        const sessionData = results[0].session_data;

        db.query(
          "INSERT INTO history (phone_number, name, session_data, date, status) VALUES (?, ?, ?, ?, '1')",
          [phoneNumber, name, sessionData, datetime],
          (err) => {
            if (err) throw err;
            db.query(
              "UPDATE users SET session_data = NULL WHERE phone_number = ?",
              [phoneNumber],
              (err) => {
                if (err) throw err;
                if (callback) callback();
              }
            );
          }
        );
      }
    }
  );
}

module.exports = {
  saveHistory,
};
