const express = require('express');
const http = require('http');
const { Server } = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
    path: '/websocket',
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

// Add a simple route for testing
app.get('/ping', (req, res) => {
    console.log('Ping request received');
    res.json({ message: 'Pong!' });
});

const PORT = 3200;
server.listen(PORT, () => console.log(`Server running on port ${PORT}`));