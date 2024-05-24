// notificationServer.js

const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
require('dotenv').config();

const PORT = process.env.PORT || 3000;

const app = express();
const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST'],
  },
});

io.on('connection', (socket) => {
  console.log(`User connected: ${socket.id}`);

  socket.on('disconnect', () => {
    console.log(`User disconnected: ${socket.id}`);
  });
});

const sendNotification = (message) => {
  io.emit('notification', message);
};

server.listen(PORT, () => {
  console.log(`Socket.io server is running on port ${PORT}`);
});

module.exports = { sendNotification };
