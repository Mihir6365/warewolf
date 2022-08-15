const express = require("express");
const bodyParser = require("body-parser");
const app = express();
var path = require("path");
const http = require("http");
const server = http.createServer(app);
const { Server } = require("socket.io");
const io = new Server(server);
app.use(
  bodyParser.urlencoded({
    extended: true,
  })
);
app.set("view engine", "ejs");
app.use(express.static(path.join(__dirname, "public")));

var users = {};
var recentdeath;
var votecount = 0;
var alivecount = 0;
var wolfcount = 0;
var seercount = 0;
var rolesubmission = 0;
var gameend = false;
var uname;
var rooms = [];

function getrandom() {
  var code = "";
  var possible =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  for (var i = 0; i < 4; i++)
    code += possible.charAt(Math.floor(Math.random() * possible.length));
  return code;
}

app.get("/", (req, res) => {
  res.render("landing", { error: "" });
});

app.post("/", (req, res) => {
  if (req.body.name == "") {
    res.render("landing", { error: "please enter a valid name" });
  }
  if (req.body.code == "") {
    var code = getrandom();
    while (rooms.includes(code)) {
      code = getrandom();
    }
    rooms.push(code);
    uname = req.body.name;
    console.log(code);
    res.sendFile(__dirname + "/index.html");
  } else if (!rooms.includes(req.body.code)) {
    res.render("landing", { error: "invalid code" });
  } else {
    uname = req.body.name;
    res.sendFile(__dirname + "/index.html");
  }
});

app.get("/home", (req, res) => {
  res.sendFile(__dirname + "/landing.html");
});

io.on("connection", (socket) => {
  console.log("connection established");
  socket.join("alive");
  let user = {
    name: uname,
    id: socket.id,
    status: "alive",
    votes: 0,
    role: "none",
  };
  users[socket.id] = user;
  socket.broadcast.emit("user-joined", uname);
  alivecount++;
  // console.log(socket.client.conn.server.clientsCount)

  //---------------------------------------------------------------USER JOINS-----------------------------------------------------------------

  socket.on("new-user-joined", () => {});

  //---------------------------------------------------------------SEND MESSAGE----------------------------------------------------------------

  socket.on("send", (message) => {
    socket.broadcast.emit("receive", {
      message: message,
      name: users[socket.id].name,
    });
  });

  //---------------------------------------------------------------USER DISCONNECTS------------------------------------------------------------

  socket.on("disconnect", () => {
    socket.broadcast.emit("user-left", users[socket.id]);
    if (users[socket.id].role == "Wolf") {
      wolfcount--;
      if (wolfcount == 0) {
        io.sockets.emit("game-end", "Villagers");
      }
    }
    if (users[socket.id].role == "Seer") {
      seercount--;
    }
    if (users[socket.id].status == "alive") {
      alivecount--;
    }
    alivecount--;
    delete users[socket.id];
  });

  //---------------------------------------------------------------GAME STARTS-----------------------------------------------------------------

  socket.on("start-game", () => {
    //give random roles. seer and wolf are fixed. rest are filled with villagers
    votecount = 0;
    wolfcount = 0;
    seercount = 0;
    var roles = ["Seer", "Wolf"];
    var playercount = socket.client.conn.server.clientsCount;
    for (let i = 0; i < playercount - 2; i++) {
      roles.push("Villager");
    }
    for (var players in users) {
      var random = Math.floor(Math.random() * playercount);
      users[players].role = roles[random];
      if (roles[random] === "Wolf") {
        io.sockets.sockets.get(players).join("wolf");

        wolfcount++;
      } else if (roles[random] == "Seer") {
        io.sockets.sockets.get(players).join("seer");
        seercount++;
      } else {
        io.sockets.sockets.get(players).join("villager");
      }
      io.sockets.in(players).emit("server-message", roles[random]);
      roles.splice(random, 1);
      playercount--;
    }
    io.sockets.emit("gamestart");
    io.in("wolf").emit("startkill", users);
    io.in("seer").emit("suspect", users);
  });

  //---------------------------------------------------------------WOLF KILLS SOMEONE----------------------------------------------------------

  socket.on("kill", (player) => {
    users[player].status = "dead";
    io.sockets.sockets.get(player).leave("alive");
    if (users[player].role == "Seer") {
      io.in("seer").emit("seer-dies");
      io.sockets.sockets.get(player).leave("seer");
      seercount--;
    }
    recentdeath = player;
    alivecount--;
  });

  //----------------------------------------------------------------DAY STARTS-----------------------------------------------------------------

  socket.on("toggleday", () => {
    votecount = 0;
    rolesubmission++;
    console.log(
      "seer count is ",
      seercount,
      "wolf count is ",
      wolfcount,
      "rolesubmission is ",
      rolesubmission
    );
    if (rolesubmission == seercount + wolfcount) {
      io.sockets.emit("display-dead", users[recentdeath].name);
      io.in("alive").emit("gamephaseday", users);
      rolesubmission = 0;
    }
  });

  //----------------------------------------------------------------VOTING STARTS--------------------------------------------------------------

  socket.on("vote", (players) => {
    votecount++;
    users[players].votes++;
    if (votecount == alivecount) {
      var maxvotes = 0;
      for (var player in users) {
        if (users[player].votes > maxvotes) {
          maxvotes = users[player].votes;
        }
      }

      var maxplayersvoted = 0;
      for (var player in users) {
        if (users[player].votes == maxvotes) {
          maxplayersvoted++;
        }
      }

      if (maxplayersvoted > 1) {
        console.log("draw votes");
        io.sockets.emit("sysem-message", "wait for the night to end");
      } else {
        alivecount--;
        for (var player in users) {
          if (users[player].votes == maxvotes) {
            users[player].status = "dead";
            io.sockets.sockets.get(player).leave("alive");
            if (users[player].role == "Wolf") {
              io.sockets.sockets.get(player).leave("wolf");
              wolfcount--;
              if (wolfcount == 0) {
                io.sockets.emit("game-end", "Villagers");
              }
            }
            if (users[player].role == "Seer") {
              io.sockets.sockets.get(player).leave("Seer");
              seercount--;
            }
            if (alivecount <= 2 * wolfcount + 1) {
              io.sockets.emit("game-end", "Wolf");
              gameend = true;
            }
            io.sockets.emit("vote-end", users[player].name);
          }
          users[player].votes = 0;
        }
      }
      if (!gameend) {
        io.sockets.emit("system-message", "Wait for the night to end");
        io.in("wolf").emit("startkill", users);
        io.in("seer").emit("suspect", users);
      }
    }
  });
});

server.listen(3000, () => {
  console.log("server running");
});
