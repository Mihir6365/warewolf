var socket = io();
const form = document.getElementById('messageform');
const messagebox = document.getElementById('text-box');
const sendbutton = document.getElementById('send-button')
const container = document.querySelector('.text-area');
const pcontainer = document.getElementById('player-area')


function startgame() {
    console.log('button pressed')
    socket.emit('start-game')
}

//function to dsplay new user joined message
const appendnewuser = (message, color) => {
    const messageelement = document.createElement('div')
    messageelement.innerText = message;
    messageelement.classList.add('message')
    messageelement.classList.add('center')
    messageelement.style.color = color;
    container.append(messageelement)
}

//function to display message
const appendmessage = (message, position) => {
    const messageelement = document.createElement('div')
    messageelement.innerText = message;
    messageelement.classList.add('message')
    messageelement.classList.add(position)
    container.append(messageelement)
}

//function on submitting form
form.addEventListener('submit', (e) => {
    e.preventDefault()
    const message = messagebox.value;
    appendmessage(`you: ${message}`, 'right');
    socket.emit('send', message);
    messagebox.value = '';
})

const uname = prompt("Enter your name to join");
socket.emit('new-user-joined', uname);

//this runs when new user joins
socket.on('user-joined', data => {
    appendnewuser(`${data} joined the game`, 'greenyellow')
})

socket.on('receive', data => {
    appendmessage(`${data.name}: ${data.message}`, 'left')
})

socket.on('user-left', data => {
    appendnewuser(`${data.name} left the game`, 'red')
})