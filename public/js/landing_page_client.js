// var socket = io();
// function generate_code() {
//   socket.emit("generate-code");
// }
const codefield = document.getElementById("code-field");
var intervalId = setInterval(function () {
  if (codefield.value != "") {
    document.getElementById("login-btn").textContent = "Enter room";
  } else {
    document.getElementById("login-btn").textContent = "Generate Code";
  }
}, 100);
