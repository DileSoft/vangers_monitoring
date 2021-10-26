const net = require('net');
const express = require('express')
const cors = require('cors');
const app = express()
app.use(cors());
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
        client.on('error', () => {
          status[server] = false;
          client.destroy();
        });
        client.connect(server.endsWith(' [cx]') ? 2195 : 2197, server.endsWith(' [cx]') ? server.match(/^(.*) \[cx\]$/)[1] : server, function() {
            // client.write('Vivat Sicher, Rock\'n\'Roll forever!!!\x00\x01');
            status[server] = true;
            client.destroy();
        });
    });
}, 4000);

app.get('/', (req, res) => {
  res.send(JSON.stringify(status, null, 4));
})

app.listen(port, '0.0.0.0', () => {
  console.log(`Listening at http://localhost:${port}`)
})