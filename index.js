const express = require('express');
const app = express();
const http = require('http');
const server = http.createServer(app);
const { Server } = require("socket.io");
const io = new Server(server);
var users = [];

app.get('/', (req, res) => {
    res.sendFile(__dirname + '/index.html');
});

server.listen(8000, () => {
    console.log('listening on : 8000');
});


io.on('connection', async (socket) => {
    socket.join("General");

    socket.on('create', (PreVRoom, room) => {
        socket.leave(PreVRoom);
        socket.join(room);
    });
    socket.on('chat', (msg, room) => {
        io.to(room).emit('chat', msg,room);
    });

    socket.on('list_channel', (channel) => {
        io.emit('list_channel', channel);
    });

    socket.on('checkin', function (data) {

        var clientInfo = new Object();
        clientInfo.customId = data;
        clientInfo.clientId = socket.id;
        if (users.length == 0) {
            users.push(clientInfo);
        }
        else {
            let check = [];
            for (let compt2 = 0; compt2 < users.length; compt2++) {
                check.push(users[compt2].customId);
            }
            if (check.indexOf(data) == -1) {
                users.push(clientInfo);
            }else{
                io.emit('error');
            }
            
        }
        console.log(users);
        io.emit('checkin', users);
    });

    socket.on('disconnect', function () {
        for (var i = 0, len = users.length; i < len; ++i) {
            var c = users[i];

            if (c.clientId == socket.id) {
                users.splice(i, 1);
                break;
            }
            io.emit('checkin', users);
        }
    });

    socket.on('users', async (users, room, login) => {
        const sockets = (await io.in(room).fetchSockets()).map(socket => socket.id);
        io.emit('users', sockets, users, room, login);
    });

    socket.on("private_mess",({login,id,dest,content}) => {
        let destID = "";
        for (let compt2 = 0; compt2 < users.length; compt2++) {
            if(users[compt2].customId == dest){
                destID = users[compt2].clientId;
            }
        }
        io.to(destID).emit('private_mess',{login,content,id})
    })
});













