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
    "SELECT name FROM users WHERE phone_number = ?",
    [phoneNumber],
    (err, results) => {
      if (err) throw err;
      if (results.length > 0) {
        const name = results[0].name;
        db.query(
          "INSERT INTO history (phone_number, name, session_data) VALUES (?, ?, ?)",
          [phoneNumber, name, JSON.stringify(results)],
          (err) => {
            if (err) throw err;
            if (callback) callback(); // Execute callback after history is saved
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

// Insert new user into database and send initial state message
function insertNewUserAndSendInitialMessage(phoneNumber, callback) {
  const initialState = "initial";
  db.query(
    "INSERT INTO users (phone_number, current_state) VALUES (?, ?)",
    [phoneNumber, initialState],
    (err) => {
      if (err) throw err;
      // Fetch and send the initial state message after inserting the new user
      getStateMessage(initialState, (message) => {
        client.sendMessage(phoneNumber, message);
        callback(initialState); // Ensure the callback carries the initial state
      });
    }
  );
}

// Handle incoming messages
client.on("message", (msg) => {
  const phoneNumber = msg.from;

  // Cek apakah pesan berasal dari grup/komunitas (bukan dari nomor pribadi)
  if (msg.fromMe || msg.isGroupMsg) {
    console.log("Pesan dari grup atau saluran, abaikan.");
    return; // Jangan memproses pesan dari grup atau saluran
  }

  // Check if the user already exists in the database
  db.query(
    "SELECT current_state, name FROM users WHERE phone_number = ?",
    [phoneNumber],
    (err, results) => {
      if (err) throw err;

      if (results.length > 0) {
        // User exists, proceed with the current state
        const currentState = results[0].current_state;
        const userName = results[0].name;

        if (currentState === "end") {
          // Save session to history, reset state to initial, and start again
          saveHistory(phoneNumber, () => {
            updateUserState(phoneNumber, "initial", () => {
              getStateMessage("initial", (message) => {
                client.sendMessage(phoneNumber, message);
              });
            });
          });
        } else {
          // Process the current state and the user's input
          getNextState(currentState, msg.body, (nextState) => {
            if (nextState) {
              // Transition to the next state and send the corresponding message
              updateUserState(phoneNumber, nextState, () => {
                getStateMessage(nextState, (message) => {
                  client.sendMessage(phoneNumber, message);
                });
              });
            } else {
              // If no valid transition found, inform the user
              client.sendMessage(
                phoneNumber,
                "Maaf, saya tidak mengerti input Anda."
              );
            }
          });
        }
      } else {
        // User does not exist, insert new user and send initial message
        insertNewUserAndSendInitialMessage(phoneNumber, (initialState) => {
          // User inserted and initial message sent, nothing more to do
        });
      }
    }
  );
});

client.initialize();
