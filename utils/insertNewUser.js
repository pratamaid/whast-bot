const { db } = require("./getDatabase");

function insertNewUserAndSendInitialMessage(phoneNumber, callback) {
  const initialState = "initial";
  db.query(
    "INSERT INTO users (phone_number, current_state) VALUES (?, ?)",
    [phoneNumber, initialState],
    (err) => {
      if (err) throw err;
      getStateMessage(initialState, (message) => {
        client.sendMessage(phoneNumber, message);
        callback(initialState);
      });
    }
  );
}

module.exports = {
  insertNewUserAndSendInitialMessage,
};
