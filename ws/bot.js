var net = require('net');
var Iconv  = require('iconv').Iconv;
var iconv = require('iconv-lite');
const SmartBuffer = require('smart-buffer').SmartBuffer;

function utf8tocp866(string) {
    let iconv = new Iconv('UTF-8', 'CP866');
    return iconv.convert(string);
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
    client.write(hex2buffer(shortHex(event.length / 2) + event));
}

var send_event_buffer = (code, dataBuffer) => {
    const codeBuffer = new SmartBuffer().writeUInt8(code);
    const lengthBuffer = new SmartBuffer().
        writeInt16LE(codeBuffer.length + dataBuffer.length)
    client.write(Buffer.concat([lengthBuffer.toBuffer(), codeBuffer.toBuffer(), dataBuffer.toBuffer()]));
}

client.on('data', async function(data) {
    console.log(data);
    console.log(data.toString());
    const inputBuffer = SmartBuffer.fromBuffer(data);
    const inputLength = inputBuffer.readUInt16LE();
    let inputCode;
    if (inputLength) {
        inputCode = inputBuffer.readUInt8();
    }

    if (data.toString() === 'Enter, my son, please...\x00\x01') {
        if (process.argv[2]) {
            send_event_buffer(0x83, new SmartBuffer().writeUInt32LE(parseInt(process.argv[2]))); //attach game
            await sleep(1000);
            const name = 'vangersbot 2';
            send_event_buffer(0x88, new SmartBuffer().writeBufferNT(utf8tocp866(name)).writeStringNT('')); //set name
            await sleep(1000);
            const message = 'привет мир';
            send_event_buffer(0x95, new SmartBuffer().writeUInt32LE(0xFFFFFFFF).writeBufferNT(utf8tocp866(message))); //send message
        } else {
            send_event_buffer(0x81, new SmartBuffer());
        }
    }
    if (inputLength && inputCode === 0xce) {
        let bot_command = data.slice(4, data.length - 1);
        let iconv = new Iconv('CP866', 'UTF-8');
        bot_command = iconv.convert(bot_command).toString('utf-8');
        console.log(bot_command);
        if (bot_command === 'bot') {
            send_event_buffer(0x95, new SmartBuffer().writeUInt32LE(0xFFFFFFFF).writeBufferNT(utf8tocp866('hi'))); //send message
        }
        if (bot_command === 'bot exit') {
            send_event_buffer(0x86, new SmartBuffer());
        }
        if (bot_command === 'bot start') {
            send_event_buffer(0x95, new SmartBuffer().writeUInt32LE(0xFFFFFFFF).writeBufferNT(utf8tocp866('5'))); //send message
            await sleep(1000);
            send_event_buffer(0x95, new SmartBuffer().writeUInt32LE(0xFFFFFFFF).writeBufferNT(utf8tocp866('4'))); //send message
            await sleep(1000);
            send_event_buffer(0x95, new SmartBuffer().writeUInt32LE(0xFFFFFFFF).writeBufferNT(utf8tocp866('3'))); //send message
            await sleep(1000);
            send_event_buffer(0x95, new SmartBuffer().writeUInt32LE(0xFFFFFFFF).writeBufferNT(utf8tocp866('2'))); //send message
            await sleep(1000);
            send_event_buffer(0x95, new SmartBuffer().writeUInt32LE(0xFFFFFFFF).writeBufferNT(utf8tocp866('1'))); //send message
            await sleep(1000);
            send_event_buffer(0x95, new SmartBuffer().writeUInt32LE(0xFFFFFFFF).writeBufferNT(utf8tocp866('ПОЕХАЛИ'))); //send message
        }
    }
    if (inputLength && inputCode === 0xc1) {
        let games_count = inputBuffer.readUInt8();
        console.log('games count:' + games_count);
        while (inputBuffer.readOffset !== inputBuffer.length) {
            const game_id = inputBuffer.readUInt32LE();
            console.log('game_id:' + game_id);
            const game_name = inputBuffer.readBufferNT('cp866');
            console.log('game_name:' + iconv.decode (new Uint8Array(game_name), 'cp866'));
        }
        send_event_buffer(0x86, new SmartBuffer());
    }
});

client.on('close', function() {
    // client.write(hex2buffer('010086'));
	console.log('Connection closed');
});