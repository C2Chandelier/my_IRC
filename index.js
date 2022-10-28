const express = require('express');
const app = express();
const http = require('http');
const server = http.createServer(app);
const { Server } = require("socket.io");
const io = new Server(server);
var users = [];
var channel_array = ["General", "Ressource"];

app.get('/', (req, res) => {
    res.sendFile(__dirname + '/index.html');
});

server.listen(8000, () => {
    console.log('listening on : 8000');
});


io.on('connection', async (socket) => {
    socket.join("General");
    io.emit('channel', (channel_array,users));

    socket.on('create', (PreVRoom, room) => {
        socket.leave(PreVRoom);
        socket.join(room);
        if (channel_array.indexOf(room) == -1) {
            channel_array.push(room);
        }
    });
    socket.on('chat', (msg, room) => {
        io.to(room).emit('chat', msg, room);
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

    socket.on("private_mess", ({ login, id, dest, content }) => {
        let destID = "";
        let count = 0;
        for (let compt2 = 0; compt2 < users.length; compt2++) {
            if (users[compt2].customId == dest) {
                destID = users[compt2].clientId;
                count++;
                io.to(destID).emit('private_mess', { login, content, id })
            }
        }
        if (count == 0) {
            console.log(id);
            io.to(id).emit('private_mess_error', id);
        }
    });

    socket.on("change_log", data => {
        let check = [];
        for (let compt2 = 0; compt2 < users.length; compt2++) {
            if(users[compt2].clientId == socket.id){
                users[compt2].customId = data;
            }
        }

        console.log(users);
        io.emit('checkin', users);
    });
});













