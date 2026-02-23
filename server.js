const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const { Client } = require('ssh2');

const app = express();
const server = http.createServer(app);

// IMPORTANT: Allow your GitHub Pages domain to connect
const io = new Server(server, {
    cors: {
        origin: "https://terminal.emptyfiel.github.io",
        methods: ["GET", "POST"]
    }
});

io.on('connection', (socket) => {
    console.log('Browser connected to tunnel');
    const conn = new Client();
    
    conn.on('ready', () => {
        conn.shell((err, stream) => {
            if (err) return socket.emit('terminal-output', '\r\n*** SSH Error ***\r\n');

            // Pipe SSH output to Browser
            stream.on('data', (data) => {
                socket.emit('terminal-output', data.toString());
            });

            // Pipe Browser input to SSH
            socket.on('terminal-input', (data) => {
                stream.write(data);
            });

            stream.on('close', () => {
                conn.end();
                socket.disconnect();
            });
        });
    }).connect({
        host: '127.0.0.1', // The Pi connects to itself via SSH
        port: 22,
        username: 'snow',  // Your Pi username
        password: 'ohno' // Use an SSH Key for better security!
    });

    socket.on('disconnect', () => {
        conn.end();
        console.log('Browser disconnected');
    });
});

const PORT = 3000;
server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
    console.log(`Ensure cloudflared is pointing to http://localhost:${PORT}`);
});