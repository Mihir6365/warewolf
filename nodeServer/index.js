const io = require(socket.io)(3000)
const users = {};
io.on('connection', socket => {

    //for the event called 'new user joined', the function will run
    socket.on('new-user-joined', name => {
        users[socket.id] = name;
        socket.broadcast.emit('user joined', name)
    })
    socket.on('send', message => {
        socket.broadcast.emit('message', { message: message, name: users[socket.id] })
    })
})