const { db } = require("./getDatabase");

function resetState() {
  db.query("UPDATE users SET current_state = 'start'", (err) => {
    if (err) throw err;
  });
}

module.exports = {
  resetState,
};
