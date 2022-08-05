var socket = io();
const form = document.getElementById('messageform');
const messagebox = document.getElementById('text-box');
const sendbutton = document.getElementById('send-button')
const container = document.querySelector('.text-area');
const pcontainer = document.getElementById('voting-area')
const rolebox = document.getElementById('rolearea')
var phase = 'night';

function startgame() {
    socket.emit('start-game')
}

function togglechat() {
    if (messagebox.disabled == false) {
        messagebox.disabled = true
        messagebox.value = null
        sendbutton.disabled = true
        messagebox.placeholder = 'chat disabled'
    } else {
        messagebox.placeholder = ''
        messagebox.disabled = false
        sendbutton.disabled = false
    }
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
    appendmessage(`You: ${message}`, 'right');
    socket.emit('send', message);
    messagebox.value = null;
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

socket.on('server-message', message => {
    rolearea.innerText = `Your Role Is : ${message}`
})

socket.on('startvote', players => {
    console.log("function running")
    Object.keys(players).forEach(function(player) {
        var form = document.createElement('form')
        form.classList.add('voteform')
        var div = document.createElement('div')
        div.classList.add('left')
        div.classList.add('text')
        div.innerText = players[player].name;
        var button = document.createElement('button')
        button.setAttribute('type', 'submit')
        button.classList.add('button')
        button.classList.add('right')
        button.setAttribute('id', 'vote-button')
        if (phase == 'night') { button.textContent = 'Kill' } else { button.textContent = 'Vote' }
        form.appendChild(div);
        form.appendChild(button)
        pcontainer.appendChild(form)
    })
})

socket.on('gamephasenight', players => {
    togglechat();
})