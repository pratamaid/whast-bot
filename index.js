const { Client, LocalAuth } = require("whatsapp-web.js");
const qrcode = require("qrcode-terminal");
const mysql = require("mysql2");

const db = mysql.createConnection({
  host: "localhost",
  user: "root",
  password: "",
  database: "whatsbot",
});

db.connect((err) => {
  if (err) {
    console.error("Error connecting to database:", err);
    return;
  }
  console.log("Connected to MySQL Database");
});

const client = new Client({
  authStrategy: new LocalAuth(),
});

client.once("ready", () => {
  console.log("Client is ready!");
});

client.on("qr", (qr) => {
  qrcode.generate(qr, { small: true });
});

// Fetch state message from database
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

// Fetch next state based on user input
function getNextState(currentState, userInput, callback) {
  db.query(
    'SELECT state_to FROM transitions WHERE state_from = ? AND (user_input = ? OR user_input = "*")',
    [currentState, userInput],
    (err, results) => {
      if (err) throw err;
      if (results.length > 0) {
        callback(results[0].state_to);
      } else {
        callback(null); // No transition found
      }
    }
  );
}

// Save session data to history table
function saveHistory(phoneNumber, callback) {
  db.query(
    "SELECT name, session_data FROM users WHERE phone_number = ?",
    [phoneNumber],
    (err, results) => {
      var date = new Date();
      var current_date =
        date.getFullYear() + "-" + (date.getMonth() + 1) + "-" + date.getDate();
      var current_time =
        date.getHours() + ":" + date.getMinutes() + ":" + date.getSeconds();
      var datetime = current_date + " " + current_time;

      if (err) throw err;
      if (results.length > 0) {
        const name = results[0].name;
        const sessionData = results[0].session_data;

        // Simpan sesi ke tabel history
        db.query(
          "INSERT INTO history (phone_number, name, session_data, date) VALUES (?, ?, ?, ?)",
          [phoneNumber, name, sessionData, datetime],
          (err) => {
            if (err) throw err;

            // Bersihkan data sesi di tabel users
            db.query(
              "UPDATE users SET session_data = NULL WHERE phone_number = ?",
              [phoneNumber],
              (err) => {
                if (err) throw err;
                if (callback) callback(); // Callback setelah data disimpan
              }
            );
          }
        );
      }
    }
  );
}

// Update user state in database
function updateUserState(phoneNumber, newState, callback) {
  db.query(
    "UPDATE users SET current_state = ? WHERE phone_number = ?",
    [newState, phoneNumber],
    (err) => {
      if (err) throw err;
      if (callback) callback(); // Execute callback after state is updated, if provided
    }
  );
}

function updateSessionData(phoneNumber, userMessage, botResponse, callback) {
  db.query(
    "SELECT session_data FROM users WHERE phone_number = ?",
    [phoneNumber],
    (err, results) => {
      if (err) throw err;

      let sessionData = [];

      // Jika data sesi ada, parse JSON-nya
      if (results.length > 0 && results[0].session_data) {
        sessionData = JSON.parse(results[0].session_data);
      }

      // Tambahkan pesan dan respons baru ke data sesi
      sessionData.push({ userMessage, botResponse });

      // Perbarui data sesi di database
      db.query(
        "UPDATE users SET session_data = ? WHERE phone_number = ?",
        [JSON.stringify(sessionData), phoneNumber],
        (err) => {
          if (err) throw err;
          if (callback) callback(); // Callback setelah data diperbarui
        }
      );
    }
  );
}

// Insert new user into database and send initial state message
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

client.on("message", (msg) => {
  const phoneNumber = msg.from;

  if (msg.fromMe || msg.isGroupMsg) {
    return;
  }

  db.query(
    "SELECT current_state FROM users WHERE phone_number = ?",
    [phoneNumber],
    (err, results) => {
      if (err) throw err;

      if (results.length > 0) {
        const currentState = results[0].current_state;

        getNextState(currentState, msg.body, (nextState) => {
          if (nextState) {
            getStateMessage(nextState, (botResponse) => {
              // Simpan pesan dan respons ke sesi
              updateSessionData(phoneNumber, msg.body, botResponse, () => {
                client.sendMessage(phoneNumber, botResponse);
              });

              // Perbarui state pengguna
              updateUserState(phoneNumber, nextState, () => {
                if (nextState === "end_fix") {
                  saveHistory(phoneNumber, () => {
                    console.log(`Session for ${phoneNumber} saved.`);
                  });
                }
              });
            });
          } else {
            client.sendMessage(
              phoneNumber,
              "Maaf, saya tidak mengerti input Anda."
            );
          }
        });
      } else {
        insertNewUserAndSendInitialMessage(phoneNumber, () => {
          console.log("New user initialized.");
        });
      }
    }
  );
});

client.initialize();
