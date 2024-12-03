const { db } = require("./getDatabase");

function updateSessionData(phoneNumber, userMessage, botResponse, callback) {
  db.query(
    "SELECT session_data FROM users WHERE phone_number = ?",
    [phoneNumber],
    (err, results) => {
      if (err) throw err;

      let sessionData = [];

      if (results.length > 0 && results[0].session_data) {
        sessionData = JSON.parse(results[0].session_data);
      }

      sessionData.push({ userMessage, botResponse });

      db.query(
        "UPDATE users SET session_data = ? WHERE phone_number = ?",
        [JSON.stringify(sessionData), phoneNumber],
        (err) => {
          if (err) throw err;
          if (callback) callback();
        }
      );
    }
  );
}

module.exports = {
  updateSessionData,
};
