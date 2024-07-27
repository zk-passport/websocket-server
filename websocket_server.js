const express = require('express');
const http = require('http');
const { Server } = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
    cors: {
        origin: "*", // Be more specific in production
        methods: ["GET", "POST"]
    }
});

io.on('connection', (socket) => {
    console.log('New client connected');

    // Handle handshake
    socket.on('handshake', (data) => {
        console.log('Handshake received:', data);
        socket.emit('handshake_response', { message: 'Handshake successful!' });
    });

    socket.on('disconnect', () => {
        console.log('Client disconnected');
    });
});

const PORT = 3200;
server.listen(PORT, () => console.log(`WebSocket server running on port ${PORT}`));