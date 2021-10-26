const net = require('net');
const express = require('express')
const app = express()
const port = 2222;

const servers = require('./servers');
const status = {};

setInterval(() => {
    servers.forEach(server => {
        let client = new net.Socket();
        client.setTimeout(1000);
        client.on('timeout', () => {
            status[server] = false;
            client.destroy();
        });
        client.connect(2197, server, function() {
            // client.write('Vivat Sicher, Rock\'n\'Roll forever!!!\x00\x01');
            status[server] = true;
            client.destroy();
        });
    });
}, 4000);

app.get('/', (req, res) => {
  res.send(JSON.stringify(status, null, 4));
})

app.listen(port, () => {
  console.log(`Listening at http://localhost:${port}`)
})