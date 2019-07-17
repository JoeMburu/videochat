const express = require('express');
const app = express();
const http = require('http');
const path = require('path');
const cors = require('cors');
const basicAuth = require('basic-auth');
const process = require('process');

app.use(cors());
const server = http.createServer(app);
const publicDirectory = path.join(__dirname, 'public');

app.use(express.static(publicDirectory));
app.get('/', (req, res, next) => {
    res.sendFile(__dirname + '/public/index.html');
});

const port = process.env.PORT || 3000;
const io = require('socket.io')(server);

server.listen(port, () => {
    console.log("Server listening at port: " + port);
});
let numClients = 0;

io.sockets.on('connection', function(socket) {
    numClients++;
    if(numClients > 2) {
        socket.emit('message', 'Max of two users');

    } else {
        socket.on('join', (cb) => {        
            cb(numClients);
            console.log("In the server, number of clients: ", numClients)
        });

    }
    

    socket.on('send offer', (offer) => {
        socket.broadcast.emit('receive offer', offer);
    });

    socket.on('send answer', (answer) => {
        socket.broadcast.emit('receive answer', answer);
    });

    socket.on('send ice candidate', (candidate) => {
        socket.broadcast.emit('receive ice candidate', candidate);
    });

    socket.on('send other ice candidate', (candidate) => {
        socket.broadcast.emit('receive other ice candidate', candidate);
    });

    

});

