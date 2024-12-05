const { Client, LocalAuth } = require("whatsapp-web.js");
const express = require("express");
const socketIO = require("socket.io");
const qrcode = require("qrcode");
const http = require("http");
const { db } = require("./utils/getDatabase");
const {
  getStateMessage,
  getNextState,
  updateUserState,
} = require("./utils/getStateMessage");
const { saveHistory } = require("./utils/saveHistory");
const { updateSessionData } = require("./utils/updateSessionData");
const { resetState } = require("./utils/resetState");

const port = 8080;

const app = express();
const server = http.createServer(app);
const io = socketIO(server);

app.use(express.json());
app.use(
  express.urlencoded({
    extended: true,
  })
);

app.get("/", (req, res) => {
  res.sendFile("./page/index.html", {
    root: __dirname,
  });
});

const client = new Client({
  authStrategy: new LocalAuth(),
});

client.on("message", (msg) => {
  const phoneNumber = msg.from;

  if (msg.fromMe || msg.isGroupMsg) {
    return;
  }

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
              updateSessionData(phoneNumber, msg.body, botResponse, () => {
                client.sendMessage(phoneNumber, botResponse);
              });

              updateUserState(phoneNumber, nextState, () => {
                if (nextState === "end_fix" || nextState === "the_end") {
                  saveHistory(phoneNumber, () => {
                    console.log(`Session for ${phoneNumber} saved.`);
                    db.query(
                      `UPDATE users SET current_state = 'start' WHERE phone_number = ?`,
                      [phoneNumber],
                      (err) => {
                        if (err) throw err;
                      }
                    );
                  });
                } else if (currentState === "initial") {
                  db.query(
                    `UPDATE users SET name = ? WHERE phone_number = ?`,
                    [msg.body, phoneNumber],
                    (err) => {
                      if (err) throw err;
                    }
                  );
                } else if (currentState === "problem") {
                  db.query(
                    `UPDATE users SET problem = ? WHERE phone_number = ?`,
                    [nextState, phoneNumber],
                    (err) => {
                      if (err) throw err;
                    }
                  );
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

resetState();
client.initialize();

io.on("connection", function (socket) {
  socket.emit("message", "Connecting...");

  client.on("qr", (qr) => {
    qrcode.toDataURL(qr, (err, url) => {
      socket.emit("qr", url);
      socket.emit("message", "QR Code received, scan please!");
    });
  });

  client.on("ready", () => {
    socket.emit("ready", "Whatsapp is ready!");
    socket.emit("message", "Whatsapp is ready!");
  });

  client.on("authenticated", () => {
    socket.emit("authenticated", "Whatsapp is authenticated!");
    socket.emit("message", "Whatsapp is authenticated!");
  });

  client.on("auth_failure", function (session) {
    socket.emit("message", "Auth failure, restarting...");
  });

  client.on("disconnected", (reason) => {
    socket.emit("message", "Whatsapp is disconnected!");
    client.destroy();
    client.initialize();
  });
});

server.listen(port, function () {
  console.log("App running on *: " + port);
});
