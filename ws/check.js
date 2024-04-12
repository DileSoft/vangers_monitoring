const net = require('net');
const WebSocketClient = require('ws');
const express = require('express')
const SmartBuffer = require('smart-buffer').SmartBuffer;
const cors = require('cors');
const app = express()
app.use(cors());
const port = 2222;
const servers = require('./servers');
const status = {};

const changeStatus = (name, newStatus) => {
  if (!status[name]) {
    status[name] = {
      data: servers.find(server => server.name === name)
    }
  }
  if (status[name].status !== newStatus) {
    status[name].changedTime = new Date().toISOString();
  }
  status[name].status = newStatus;
}

const get_event_buffer = (code, dataBuffer) => {
  const codeBuffer = new SmartBuffer().writeUInt8(code);
  const lengthBuffer = new SmartBuffer().
      writeInt16LE(codeBuffer.length + dataBuffer.length)
  return Buffer.concat([lengthBuffer.toBuffer(), codeBuffer.toBuffer(), dataBuffer.toBuffer()]);
}

function connect(websocket, host, port, callback) {
  let client
  if (websocket) {
    client = new WebSocketClient(`wss://${host}:${port}`, {handshakeTimeout: 4000})
    client.on('open', callback);
  } else {
    client = new net.Socket()
    client.setTimeout(4000);
    client.connect(port, host, callback);
  }

  return client;
}

function send(websocket, client, data) {
  if (websocket) {
    client.send(data, {binary: true});
  } else {
    client.write(data);
  }
}

function destroy(websocket, client) {
  if (websocket) {
    client.close();
  } else {
    client.destroy();
  }
}

function ondata(websocket, client, callback) {
  if (websocket) {
    client.on('message', callback);
  } else {
    client.on('data', callback);
  }
}

function ontimeout(websocket, client, callback) {
  if (websocket) {

  } else {
    client.on('timeout', callback);
  }
}

function onerror(websocket, client, callback) {
  if (websocket) {
    client.on('error', callback);    
  } else {
    client.on('error', callback);
  }
}

const check = () => {
  servers.forEach(server => {
      let client = connect(server.websocket, server.host, server.port, function() {
        send(server.websocket, client, Buffer.from('Vivat Sicher, Rock\'n\'Roll forever!!!\x00' + (server.version === 1 ? '\x01' : '\x02'), 'utf-8'));
      });
  
      ontimeout(server.websocket, client, () => {
        changeStatus(server.name, false);
        destroy(server.websocket, client);
      });
      onerror(server.websocket, client, (error) => {
        if (error.toString() !== 'RangeError: Invalid WebSocket frame: invalid status code 1005') {
          changeStatus(server.name, false);
        }
        destroy(server.websocket, client);
      });
      ondata(server.websocket, client, async function(data) {
        if (data.toString() === 'Enter, my son, please...\x00' + String.fromCharCode(server.version)) {
          changeStatus(server.name, true);
          send(server.websocket, client, get_event_buffer(0x86, new SmartBuffer()));
        }
        destroy(server.websocket, client);
      });
    });
};

servers.forEach(server => changeStatus(server.name, false));
check();
setInterval(check, 30 * 60 * 1000);

app.get('/', (req, res) => {
  res.send(JSON.stringify(status, null, 4));
})

app.listen(port, '0.0.0.0', () => {
  console.log(`Listening at http://localhost:${port}`)
})