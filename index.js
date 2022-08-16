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
var uname;
var rooms = [];
var roomdata = {};
var codetojoin;

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
    codetojoin = code;
    res.sendFile(__dirname + "/index.html");
  } else if (!rooms.includes(req.body.code)) {
    res.render("landing", { error: "invalid code" });
  } else {
    uname = req.body.name;
    codetojoin = req.body.code;
    res.sendFile(__dirname + "/index.html");
  }
});

app.get("/home", (req, res) => {
  res.sendFile(__dirname + "/landing.html");
});

io.on("connection", (socket) => {
  console.log("connection established");
  socket.join("alive");
  socket.join(codetojoin);
  let user = {
    name: uname,
    id: socket.id,
    status: "alive",
    votes: 0,
    role: "none",
    roomid: codetojoin,
  };
  users[socket.id] = user;
  socket.in(users[socket.id].roomid).emit("user-joined", uname);
  roomdata[users[socket.id].roomid].alivecount++;
  // console.log(socket.client.conn.server.clientsCount)

  //---------------------------------------------------------------USER JOINS-----------------------------------------------------------------

  socket.on("new-user-joined", () => {});

  //---------------------------------------------------------------SEND MESSAGE----------------------------------------------------------------

  socket.on("send", (message) => {
    socket.in(users[socket.id].roomid).emit("receive", {
      message: message,
      name: users[socket.id].name,
    });
  });

  //---------------------------------------------------------------USER DISCONNECTS------------------------------------------------------------

  socket.on("disconnect", () => {
    socket.in(users[socket.id].roomid).emit("user-left", users[socket.id]);
    if (users[socket.id].role == "Wolf") {
      roomdata[users[socket.id].roomid].wolfcount--;
      if (roomdata[users[socket.id].roomid].wolfcount == 0) {
        io.in(users[socket.id].roomid).emit("game-end", "Villagers");
      }
    }
    if (users[socket.id].role == "Seer") {
      roomdata[users[socket.id].roomid].seercount--;
    }
    if (users[socket.id].status == "alive") {
      roomdata[users[socket.id].roomid].alivecount--;
    }
    roomdata[users[socket.id].roomid].alivecount--;
    delete users[socket.id];
  });

  //---------------------------------------------------------------GAME STARTS-----------------------------------------------------------------

  socket.on("start-game", () => {
    roomdata[users[socket.id].roomid].recentdeath = "none";
    roomdata[users[socket.id].roomid].votecount = 0;
    roomdata[users[socket.id].roomid].alivecount = 0;
    roomdata[users[socket.id].roomid].wolfcount = 0;
    roomdata[users[socket.id].roomid].seercount = 0;
    roomdata[users[socket.id].roomid].rolesubmission = 0;
    roomdata[users[socket.id].roomid].gameend = false;
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

        roomdata[users[socket.id].roomid].wolfcount++;
      } else if (roles[random] == "Seer") {
        io.sockets.sockets.get(players).join("seer");
        roomdata[users[socket.id].roomid].seercount++;
      } else {
        io.sockets.sockets.get(players).join("villager");
      }
      // io.sockets.in(players).emit("server-message", roles[random]);
      io.sockets.in(players).emit("server-message", roles[random]);
      roles.splice(random, 1);
      playercount--;
    }
    io.in(users[socket.id].roomid).emit("gamestart");
    io.in("wolf", users[socket.id].roomid).emit("startkill", users);
    io.in("seer", users[socket.id].roomid).emit("suspect", users);
  });

  //---------------------------------------------------------------WOLF KILLS SOMEONE----------------------------------------------------------

  socket.on("kill", (player) => {
    users[player].status = "dead";
    io.sockets.sockets.get(player).leave("alive");
    if (users[player].role == "Seer") {
      io.in("seer", users[socket.id].roomid).emit("seer-dies");
      io.sockets.sockets.get(player).leave("seer");
      roomdata[users[socket.id].roomid].seercount--;
    }
    roomdata[users[socket.id].roomid].recentdeath = player;
    roomdata[users[socket.id].roomid].alivecount--;
  });

  //----------------------------------------------------------------DAY STARTS-----------------------------------------------------------------

  socket.on("toggleday", () => {
    roomdata[users[socket.id].roomid].votecount = 0;
    roomdata[users[socket.id].roomid].rolesubmission++;
    if (
      roomdata[users[socket.id].roomid].rolesubmission ==
      roomdata[users[socket.id].roomid].seercount +
        roomdata[users[socket.id].roomid].wolfcount
    ) {
      io.in(users[socket.id].roomid).emit(
        "display-dead",
        users[roomdata[users[socket.id].roomid].recentdeath].name
      );
      io.in("alive", users[socket.id].roomid).emit("gamephaseday", users);
      roomdata[users[socket.id].roomid].rolesubmission = 0;
    }
  });

  //----------------------------------------------------------------VOTING STARTS--------------------------------------------------------------

  socket.on("vote", (players) => {
    roomdata[users[socket.id].roomid].votecount++;
    users[players].votes++;
    if (
      roomdata[users[socket.id].roomid].votecount ==
      roomdata[users[socket.id].roomid].alivecount
    ) {
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
        io.in(users[socket.id].roomid).emit(
          "sysem-message",
          "wait for the night to end"
        );
      } else {
        roomdata[users[socket.id].roomid].alivecount--;
        for (var player in users) {
          if (users[player].votes == maxvotes) {
            users[player].status = "dead";
            io.sockets.sockets.get(player).leave("alive");
            if (users[player].role == "Wolf") {
              io.sockets.sockets.get(player).leave("wolf");
              roomdata[users[socket.id].roomid].wolfcount--;
              if (roomdata[users[socket.id].roomid].wolfcount == 0) {
                io.in(users[socket.id].roomid).emit("game-end", "Villagers");
              }
            }
            if (users[player].role == "Seer") {
              io.sockets.sockets.get(player).leave("Seer");
              roomdata[users[socket.id].roomid].seercount--;
            }
            if (
              roomdata[users[socket.id].roomid].alivecount <=
              2 * roomdata[users[socket.id].roomid].wolfcount + 1
            ) {
              io.in(users[socket.id].roomid).emit("game-end", "Wolf");
              roomdata[users[socket.id].roomid].gameend = true;
            }
            io.in(users[socket.id].roomid).emit("vote-end", users[player].name);
          }
          users[player].votes = 0;
        }
      }
      if (!roomdata[users[socket.id].roomid].gameend) {
        io.in(users[socket.id].roomid).emit(
          "system-message",
          "Wait for the night to end"
        );
        io.in("wolf", users[socket.id].roomid).emit("startkill", users);
        io.in("seer", users[socket.id].roomid).emit("suspect", users);
      }
    }
  });
});

server.listen(3000, () => {
  console.log("server running");
});
