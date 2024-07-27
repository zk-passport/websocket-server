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

const sessions = new Map();

io.on('connection', (socket) => {
    const { sessionId, clientType } = socket.handshake.query;
    console.log(`New ${clientType} client connected with session ID: ${sessionId}`);

    if (!sessions.has(sessionId)) {
        sessions.set(sessionId, { web: null, mobile: null });
    }
    sessions.get(sessionId)[clientType] = socket;

    if (clientType === 'mobile') {
        updateWebStatus(sessionId, 'Connected');
    }

    socket.on('mobile_connected', (data) => {
        updateWebStatus(data.sessionId, 'Connected');
    });

    socket.on('handshake', (data) => {
        console.log('Handshake received:', data);
        updateWebStatus(data.sessionId, 'Handshake initiated');
        socket.emit('handshake_response', { message: 'Handshake successful!' });
    });

    socket.on('disconnect', () => {
        console.log(`Client disconnected: ${clientType}`);
        if (clientType === 'mobile') {
            updateWebStatus(sessionId, 'Disconnected');
        }
        sessions.get(sessionId)[clientType] = null;
        if (!sessions.get(sessionId).web && !sessions.get(sessionId).mobile) {
            sessions.delete(sessionId);
        }
    });
});

function updateWebStatus(sessionId, status) {
    const session = sessions.get(sessionId);
    if (session && session.web) {
        session.web.emit('mobile_status', { status });
    }
}

const PORT = 3200;
server.listen(PORT, () => console.log(`Server running on port ${PORT}`));