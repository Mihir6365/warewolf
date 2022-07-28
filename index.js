const express = require('express');
const app = express();
var path = require('path')
const http = require('http');
const server = http.createServer(app);
const { Server } = require("socket.io");
const io = new Server(server);
app.use(express.static(path.join(__dirname, 'public')));

var users = {};
app.get('/', (req, res) => {
    res.sendFile(__dirname + '/index.html');
});

io.on('connection', (socket) => {
    socket.on('new-user-joined', uname => {
        let user = { name: uname, id: socket.id }
        users[socket.id] = user
            // console.log(socket.client.conn.server.clientsCount)
        socket.broadcast.emit('user-joined', uname)
    });
    socket.on('send', message => {
        socket.broadcast.emit('receive', { message: message, name: users[socket.id].name })
    });
    socket.on('disconnect', () => {
        socket.broadcast.emit('user-left', users[socket.id]);
        delete users[socket.id];
    });

    socket.on('start-game', () => {
        var roles = ['seer', 'wolf']
        var playercount = socket.client.conn.server.clientsCount;
        for (let i = 0; i < playercount - 2; i++) {
            roles.push('villager')
        }
        for (var players in users) {
            var random = Math.floor(Math.random() * playercount)
            users[players].role = roles[random];
            roles.splice(random, 1)
            playercount--
        }
    });
});

server.listen(3000, () => {
    console.log('server running');
});