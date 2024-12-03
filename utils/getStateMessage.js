const { db } = require("./getDatabase");

function getStateMessage(state, callback) {
  db.query(
    "SELECT message FROM states WHERE state_name = ?",
    [state],
    (err, results) => {
      if (err) throw err;
      if (results.length > 0) {
        callback(results[0].message);
      } else {
        callback("State tidak ditemukan di database.");
      }
    }
  );
}

function getNextState(currentState, userInput, callback) {
  db.query(
    'SELECT state_to FROM transitions WHERE state_from = ? AND (user_input = ? OR user_input = "*")',
    [currentState, userInput],
    (err, results) => {
      if (err) throw err;
      if (results.length > 0) {
        callback(results[0].state_to);
      } else {
        callback(null);
      }
    }
  );
}

function updateUserState(phoneNumber, newState, callback) {
  db.query(
    "UPDATE users SET current_state = ? WHERE phone_number = ?",
    [newState, phoneNumber],
    (err) => {
      if (err) throw err;
      if (callback) callback();
    }
  );
}

module.exports = {
  getStateMessage,
  getNextState,
  updateUserState,
};
