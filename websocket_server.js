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
        updateWebStatus(sessionId, 'Mobile Connected');
    }

    socket.on('proof_generation_start', (data) => {
        console.log('Proof generation started:', data);
        updateWebStatus(data.sessionId, 'Proof Generation Started');
    });

    socket.on('proof_generated', (data) => {
        console.log('Proof generated:', data);
        updateWebStatus(data.sessionId, 'Proof Generated');
        // Here you would typically verify the proof
        // For this example, we'll just send back a success message
        //socket.emit('proof_verification_result', { success: true });
        socket.emit('proof_generated', data);
    });

    socket.on('disconnect', () => {
        console.log(`Client disconnected: ${clientType}`);
        if (clientType === 'mobile') {
            updateWebStatus(sessionId, 'Mobile Disconnected');
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