const express = require('express');
const app = express();
var path = require('path')
const http = require('http');
const server = http.createServer(app);
const { Server } = require("socket.io");
const io = new Server(server);
app.use(express.static(path.join(__dirname, 'public')));


const users = {};
app.get('/', (req, res) => {
    res.sendFile(__dirname + '/index.html');
});
io.on('connection', (socket) => {

    //for the event called 'new user joined', the function will run
    socket.on('new-user-joined', uname => {
        users[socket.id] = uname;
        // console.log(socket.client.conn.server.clientsCount)
        console.log(users)
        socket.broadcast.emit('user-joined', { uname: uname, id: socket.id })
    });
    socket.on('send', message => {
        socket.broadcast.emit('receive', { message: message, name: users[socket.id] })
    });
    socket.on('disconnect', message => {
        socket.broadcast.emit('user-left', users[socket.id]);
        // console.log(socket.client.conn.server.clientsCount)
        console.log(users)
        delete users[socket.id];
    });
});

server.listen(3000, () => {
    console.log('listening on *:3000');
});