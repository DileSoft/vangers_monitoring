const net = require('net');
const express = require('express')
const SmartBuffer = require('smart-buffer').SmartBuffer;
const cors = require('cors');
const app = express()
app.use(cors());
const port = 2222;
const servers = require('./servers');
const status = {};

const changeStatus = (server, newStatus) => {
  if (!status[server]) {
    status[server] = {}
  }
  if (status[server].status !== newStatus) {
    status[server].changedTime = new Date().toISOString();
  }
  status[server].status = newStatus;
}

const send_event_buffer = (client, code, dataBuffer) => {
  const codeBuffer = new SmartBuffer().writeUInt8(code);
  const lengthBuffer = new SmartBuffer().
      writeInt16LE(codeBuffer.length + dataBuffer.length)
  client.write(Buffer.concat([lengthBuffer.toBuffer(), codeBuffer.toBuffer(), dataBuffer.toBuffer()]));
}

setInterval(() => {
    servers.forEach(server => {
        let client = new net.Socket();
        client.setTimeout(4000);
        client.on('timeout', () => {
            changeStatus(server, false);
            client.destroy();
        });
        client.on('error', () => {
          changeStatus(server, false);
          client.destroy();
        });
        client.connect(server.endsWith(' [cx]') ? 2195 : 2197, server.endsWith(' [cx]') ? server.match(/^(.*) \[cx\]$/)[1] : server, function() {
            client.write('Vivat Sicher, Rock\'n\'Roll forever!!!\x00' + (server.endsWith(' [cx]') ? '\x02' : '\x01'));
        });
        client.on('data', async function(data) {
          changeStatus(server, true);
          if (data.toString() === 'Enter, my son, please...\x00\x01') {
            send_event_buffer(client, 0x86, new SmartBuffer());
          }
          client.destroy();
        });
    });
}, 10000);

app.get('/', (req, res) => {
  res.send(JSON.stringify(status, null, 4));
})

app.listen(port, '0.0.0.0', () => {
  console.log(`Listening at http://localhost:${port}`)
})