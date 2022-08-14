var socket = io();
const form = document.getElementById("messageform");
const messagebox = document.getElementById("text-box");
const sendbutton = document.getElementById("send-button");
const container = document.querySelector(".text-area");
const pcontainer = document.getElementById("voting-area");
const rolebox = document.getElementById("rolearea");
const gamestartbutton = document.getElementById("gamestartbutton");
const sysmessage = document.getElementById("sysmessagedisplayer");
var phase = "night";

//=====================================================GAME START================================================================================

function startgame() {
  socket.emit("start-game");
}

//=====================================================DISABLE CHAT==============================================================================

function disablechat() {
  messagebox.disabled = true;
  messagebox.value = null;
  sendbutton.disabled = true;
  messagebox.placeholder = "chat disabled";
}

//=====================================================ENABLE CHAT===============================================================================

function enablechat() {
  messagebox.placeholder = "";
  messagebox.disabled = false;
  sendbutton.disabled = false;
}

//=====================================================TAKE USER NAME============================================================================

socket.emit("new-user-joined");

//=====================================================START GAME================================================================================

socket.on("gamestart", () => {
  sysmessage.innerText = "Wait until day arrives";
  gamestartbutton.classList.add("hidden");
  disablechat();
});

//=====================================================ADD SYSTEM MESSAGE TO CHAT BOX============================================================

const appendsysmessage = (message, color) => {
  const messageelement = document.createElement("div");
  messageelement.innerText = message;
  messageelement.classList.add("message");
  messageelement.classList.add("center");
  messageelement.style.color = color;
  container.append(messageelement);
};

//=====================================================NORMAL MESSAGE APPEND=====================================================================

const appendmessage = (message, position) => {
  const messageelement = document.createElement("div");
  messageelement.innerText = message;
  messageelement.classList.add("message");
  messageelement.classList.add(position);
  container.append(messageelement);
};

//=====================================================SEND A NORMAL MESSAGE=====================================================================

form.addEventListener("submit", (e) => {
  e.preventDefault();
  const message = messagebox.value;
  appendmessage(`You: ${message}`, "right");
  socket.emit("send", message);
  messagebox.value = null;
});

//=====================================================SOMEONE JOINED GAME MESSAGE===============================================================

socket.on("user-joined", (data) => {
  appendsysmessage(`${data} joined the game`, "greenyellow");
});

//=====================================================RECEIVEING MESSAGE========================================================================

socket.on("receive", (data) => {
  appendmessage(`${data.name}: ${data.message}`, "left");
});

//====================================================WHEN SOMEONE LEAVES========================================================================

socket.on("user-left", (data) => {
  appendsysmessage(`${data.name} left the game`, "red");
});

//=====================================================DISPLAY ROLES=============================================================================

socket.on("server-message", (message) => {
  rolearea.innerText = `Your Role Is : ${message}`;
});

//=====================================================KILL : WOLF========================================================================

socket.on("startkill", (players) => {
  sysmessage.innerText = "Pick a player to kill";
  pcontainer.classList.remove("hidden");
  pcontainer.innerHTML = "";
  Object.keys(players).forEach(function (player) {
    if (
      players[player].role.localeCompare("Wolf") != 0 &&
      players[player].status.localeCompare("dead") != 0
    ) {
      var form = document.createElement("form");
      form.classList.add("voteform");
      var div = document.createElement("div");
      div.classList.add("left");
      div.classList.add("text");
      div.innerText = players[player].name;
      var button = document.createElement("button");
      button.setAttribute("type", "submit");
      button.classList.add("button");
      button.classList.add("right");
      button.setAttribute("id", "vote-button");
      button.textContent = "Kill";
      form.appendChild(div);
      form.appendChild(button);
      form.addEventListener("submit", (e) => {
        e.preventDefault();
        pcontainer.classList.add("hidden");
        socket.emit("kill", player);
        socket.emit("toggleday");
      });
      pcontainer.appendChild(form);
    }
  });
});

//============================================================SUSPECT : SEER=====================================================================

socket.on("suspect", (players) => {
  sysmessage.innerText = "Pick a player who you think is wolf";
  pcontainer.classList.remove("hidden");
  pcontainer.innerHTML = "";

  Object.keys(players).forEach(function (player) {
    if (
      players[player].role.localeCompare("Seer") != 0 &&
      players[player].status == "alive"
    ) {
      var form = document.createElement("form");
      form.classList.add("voteform");
      var div = document.createElement("div");
      div.classList.add("left");
      div.classList.add("text");
      div.innerText = players[player].name;
      var button = document.createElement("button");
      button.setAttribute("type", "submit");
      button.classList.add("button");
      button.classList.add("right");
      button.setAttribute("id", "vote-button");
      button.textContent = "suspect";
      form.appendChild(div);
      form.appendChild(button);
      form.addEventListener("submit", (e) => {
        e.preventDefault();
        pcontainer.classList.add("hidden");
        if (players[player].role == "Wolf") {
          appendsysmessage(`${players[player].name} was the wolf`, "yellow");
        } else {
          appendsysmessage(
            `${players[player].name} was NOT the wolf`,
            "yellow"
          );
        }
        socket.emit("toggleday");
      });
      pcontainer.appendChild(form);
    }
  });
});

//=====================================================DISPLAY KILLED============================================================================

socket.on("display-dead", (name) => {
  if (phase != "none") {
    appendsysmessage(`${name} was killed`, "yellow");
  }
});

//=====================================================DAY: START VOTE===========================================================================

socket.on("gamephaseday", (players) => {
  sysmessage.innerText = "Vote a player to vote. That player will be killed.";
  enablechat();
  pcontainer.classList.remove("hidden");
  pcontainer.innerHTML = "";

  Object.keys(players).forEach(function (player) {
    if (players[player].status.localeCompare("dead") != 0) {
      var form = document.createElement("form");
      form.classList.add("voteform");
      var div = document.createElement("div");
      div.classList.add("left");
      div.classList.add("text");
      div.innerText = players[player].name;
      var button = document.createElement("button");
      button.setAttribute("type", "submit");
      button.classList.add("button");
      button.classList.add("right");
      button.setAttribute("id", "vote-button");
      button.textContent = "Vote";
      form.appendChild(div);
      form.appendChild(button);
      form.addEventListener("submit", (e) => {
        e.preventDefault();
        pcontainer.classList.add("hidden");
        appendsysmessage(`You voted for ${players[player].name}`, "yellow");
        socket.emit("vote", player);
      });
      pcontainer.appendChild(form);
    }
  });
});

//=====================================================VOTE END: DISPLAY VOTED PLAYER============================================================

socket.on("vote-end", (name) => {
  if (phase != "none") {
    disablechat();
    appendsysmessage(`${name} was voted out`, "yellow");
  }
});

//=========================================================Display any system message============================================================

socket.on("system-message", (message) => {
  sysmessage.innerText = message;
});

//=============================================================Special case seer dies============================================================

socket.on("seer-dies", () => {
  pcontainer.classList.add("hidden");
  sysmessage.innerText = "Wolf killed you";
});

//=====================================================END: DISPLAY WINNER=======================================================================

socket.on("game-end", (winner) => {
  sysmessage.innerText = "The game has ended";
  appendsysmessage(`${winner} won the game`, "aqua");
  pcontainer.classList.add("hidden");
  gamestartbutton.classList.remove("hidden");
  gamestartbutton.textContent = "play again";
  enablechat();
  phase = "none";
});
