const WebSocket = require('ws');
const fs = require('fs');

const wss = new WebSocket.Server({ port: 8084 });

wss.on('connection', function connection(ws) {

    fs.readFile('../../server.json', 'utf8', (err, data) => {
        ws.send(data);
    });
});

let prev = '';
setInterval(() => {
    fs.readFile('../../server.json', 'utf8', (err, data) => {
        if (data && data != prev) {
            wss.clients.forEach(function each(client) {
                client.send(data);
            })
            prev = data;
        }
    });
}, 10);
