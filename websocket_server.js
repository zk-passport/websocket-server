const express = require('express');
const http = require('http');
const { Server } = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
    path: '/websocket',
    cors: {
        origin: "*",
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
        updateWebStatus(sessionId, 'mobile_connected');
    }

    socket.on('proof_generation_start', (data) => {
        updateWebStatus(data.sessionId, 'proof_generation_started');
    });

    socket.on('proof_generation_failed', (data) => {
        updateWebStatus(data.sessionId, 'proof_generation_failed');
    });

    socket.on('proof_generated', (data) => {
        updateWebStatus(data.sessionId, 'proof_generated', data.proof ? data.proof : null);
        socket.emit('proof_generated', data);
    });

    socket.on('proof_verified', (data) => {
        updateMobileStatus(data.sessionId, data.proofVerified);
    });

    socket.on('disconnect', () => {
        if (clientType === 'mobile') {
            updateWebStatus(sessionId, 'mobile_disconnected');
        }
        sessions.get(sessionId)[clientType] = null;
        if (!sessions.get(sessionId).web && !sessions.get(sessionId).mobile) {
            sessions.delete(sessionId);
        }
    });
});

function updateWebStatus(sessionId, status, proof = null) {
    const session = sessions.get(sessionId);
    if (session && session.web) {
        session.web.emit('mobile_status', { status, proof });
    }
}

function updateMobileStatus(sessionId, verificationResult) {
    const session = sessions.get(sessionId);
    if (session && session.mobile) {
        session.mobile.emit('proof_verification_result', verificationResult);
    }
}

const PORT = 3200;
server.listen(PORT, () => console.log(`Server running on port ${PORT}`));