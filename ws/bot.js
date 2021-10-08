var net = require('net');

function hex2buffer(string, inverse) {
    let bytes = string.match(/.{1,2}/g);
    return Buffer.from(bytes.map(byte => parseInt(byte, 16)));
}

function longHex(int) {
    arr = new ArrayBuffer(4); // an Int32 takes 4 bytes
    view = new DataView(arr);
    view.setUint32(0, int, true);
    return [...new Uint8Array(arr)]
      .map(x => x.toString(16).padStart(2, '0'))
      .join('').toUpperCase();
}

function shortHex(int) {
    arr = new ArrayBuffer(2); // an Int32 takes 4 bytes
    view = new DataView(arr);
    view.setUint16(0, int, true);
    return [...new Uint8Array(arr)]
      .map(x => x.toString(16).padStart(2, '0'))
      .join('').toUpperCase();
}

function stringToAsciiz(string) {
    var arr=[];
    for(var i=0; i<string.length; i++) {
        arr.push(string.charCodeAt(i))
    }
    arr.push(0);
    return arr.map(x => x.toString(16).padStart(2, '0'))
    .join('').toUpperCase();
}

let sleep = (ms) => {
    return new Promise((resolve, reject) => {
        setTimeout(() => resolve(), ms);
    })
}

var client = new net.Socket();
client.connect(2197, '127.0.0.1', function() {
	console.log('Connected');
	client.write('Vivat Sicher, Rock\'n\'Roll forever!!!\x00\x01');
});

var send_event = (code, data) => {
    let event = code + data;
    client.write(hex2buffer(shortHex(event.length / 2) + event)); //attach game
}

client.on('data', async function(data) {
    // console.log('Received: ' + data);
    console.log(data);
    if (data.toString() === 'Enter, my son, please...\x00\x01') {
        // client.write(hex2buffer('010081')); //get games
        // client.write(hex2buffer(shortHex(5) + '83' + longHex(1))); //attach game
        send_event('83', longHex(1));
        await sleep(1000);
        const name = 'vangers bot';
        // client.write(hex2buffer(shortHex(1 + name.length + 2) + '88' + stringToAsciiz(name) + '00')); //register name
        send_event('88', stringToAsciiz(name) + '00');
        await sleep(1000);
        const message = 'hello world';
        // client.write(hex2buffer(shortHex(5 + message.length + 1) + '95' + 'FFFFFFFF' + stringToAsciiz(message))); //send message
        send_event('95', stringToAsciiz(name) + 'FFFFFFFF' + stringToAsciiz(message));
        await sleep(1000);
        // client.write(hex2buffer(shortHex(1) + '86')); //close socket
        send_event('86', '');
        // setInterval( () => client.write(hex2buffer('0900' + '95' + 'FFFFFFFF' + '41414100')), 1000); //send message
    }
    if (data[3].toString(16) === 'ce') {

    }
});

client.on('close', function() {
    client.write(hex2buffer('010086'));
	console.log('Connection closed');
});