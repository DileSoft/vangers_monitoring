const WebSocket = require('ws');
const fs = require('fs');

const wss = new WebSocket.Server({ port: 8084 });

let prev = '';
wss.on('connection', function connection(ws) {
    
    ws.send(prev);

    // fs.readFile('../../server.json', 'utf8', (err, data) => {
    //     ws.send(data);
    // });
});

let broadcast = (data) => {
    if (data && data != prev) {
        wss.clients.forEach(function each(client) {
            client.send(data);
        })
        
        fs.writeFile('../../server.json', data, ()=>{});
        prev = data;
    }
}

// setInterval(() => {
//     fs.readFile('../../server.json', 'utf8', (err, data) => {
//             broadcast(data);
//     });
// }, 10);

var net = require('net');
var server = net.createServer(function(socket) {
    // confirm socket connection from client
    // console.log((new Date())+'A client connected to server...');
    socket.on('data', function(data) {
        broadcast(data.toString('utf8'));
    });
    // // send info to client
    // socket.write('Echo from server: NODE.JS Server \r\n');
    // socket.pipe(socket);
    // socket.end();
    // console.log('The client has disconnected...\n');
}).listen(8484, 'localhost');