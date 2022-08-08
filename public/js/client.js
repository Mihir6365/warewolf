var socket = io();
const form = document.getElementById('messageform');
const messagebox = document.getElementById('text-box');
const sendbutton = document.getElementById('send-button')
const container = document.querySelector('.text-area');
const pcontainer = document.getElementById('voting-area')
const rolebox = document.getElementById('rolearea')
const gamestartbutton = document.getElementById('gamestartbutton')
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
const appendsysmessage = (message, color) => {
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
    appendsysmessage(`${data} joined the game`, 'greenyellow')
})

socket.on('receive', data => {
    appendmessage(`${data.name}: ${data.message}`, 'left')
})

socket.on('user-left', data => {
    appendsysmessage(`${data.name} left the game`, 'red')
})

socket.on('server-message', message => {
    rolearea.innerText = `Your Role Is : ${message}`
})

socket.on('startkill', players => {
    pcontainer.classList.remove('hidden');
    pcontainer.innerHTML = ""
    Object.keys(players).forEach(function(player) {
        if (players[player].role.localeCompare('Wolf') != 0 && players[player].status.localeCompare('dead') != 0) {
            console.log(' role is', players[player].role.localeCompare('Wolf'))
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
            button.textContent = 'Kill'
            form.appendChild(div);
            form.appendChild(button)
            form.addEventListener('submit', (e) => {
                e.preventDefault()
                pcontainer.classList.add('hidden')
                socket.emit("kill", player)
            })
            pcontainer.appendChild(form)
        }
    })
})

socket.on('suspect', players => {
    pcontainer.classList.remove('hidden');
    pcontainer.innerHTML = ""

    Object.keys(players).forEach(function(player) {
        if (players[player].role.localeCompare('Seer') != 0) {
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
            button.textContent = 'suspect'
            form.appendChild(div);
            form.appendChild(button)
            form.addEventListener('submit', (e) => {
                e.preventDefault()
                pcontainer.classList.add('hidden')
                if (players[player].role == 'Wolf') { appendsysmessage(`${players[player].name} was the wolf`, 'yellow') } else { appendsysmessage(`${players[player].name} was NOT the wolf`, 'yellow') }
                socket.emit('toggleday')
            })
            pcontainer.appendChild(form)
        }
    })
})


socket.on('gamephasenight', () => {
    gamestartbutton.classList.add('hidden');
    togglechat()
})

socket.on('display-dead', name => {
    appendsysmessage(`${name} was killed`, 'yellow')
})

socket.on('gamephaseday', players => {
    togglechat();
    pcontainer.classList.remove('hidden');
    pcontainer.innerHTML = ""

    Object.keys(players).forEach(function(player) {
        if (players[player].status.localeCompare('dead') != 0) {
            console.log(' role is', players[player].role.localeCompare('Wolf'))
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
            button.textContent = 'Vote'
            form.appendChild(div);
            form.appendChild(button)
            form.addEventListener('submit', (e) => {
                e.preventDefault()
                pcontainer.classList.add('hidden')
                appendsysmessage(`You voted for ${players[player].name}`, 'yellow')
                    // socket.emit("kill", player)
            })
            pcontainer.appendChild(form)
        }
    })
})