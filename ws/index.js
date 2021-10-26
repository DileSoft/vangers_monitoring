const WebSocket = require('ws');
const fs = require('fs');

const wss = new WebSocket.Server({ port: 8084 });

let prev = '';
let results = {

};
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

        let json = JSON.parse(data);
        json.games.forEach(game => {
            if (!results[game.uuid]) {
                results[game.uuid] = {
                    players: {}
                };
            }
            let old_players = results[game.uuid].players;
            results[game.uuid] = JSON.parse(JSON.stringify(game));
            results[game.uuid].players = old_players;
            game.players.forEach(player => {
                results[game.uuid].players[player.ID] = player;
            });
        });
    
        fs.writeFile('../../server.json', data, ()=>{});
        prev = data;
    }
}

// setInterval(() => {
//     fs.readFile('../../server.json', 'utf8', (err, data) => {
//             broadcast(data);
//     });
// }, 10);

results = JSON.parse(fs.readFileSync(__dirname + '/history.json').toString('utf-8'));
setInterval(() => {
    fs.writeFile(__dirname + '/history.json', JSON.stringify(results), ()=>{});
}, 1000);

var net = require('net');
let chunks = '';
let chunks_count = 0;
var server = net.createServer(function(socket) {
    // confirm socket connection from client
    // console.log((new Date())+'A client connected to server...');
    socket.on('data', function(data) {
        try {
            //console.log(data.toString());
            if (chunks === '' && data.toString()[0] !== '{') {
                return;
            }
            if (chunks_count > 10) {
                chunks = '';
                chunks_count = 0;
                return;
            }
            chunks += data.toString();
            chunks_count++;
            JSON.parse(chunks.toString());
            broadcast(chunks);
            chunks = '';
            chunks_count = 0;
        } catch (e) {
            
        }
    });
    // // send info to client
    // socket.write('Echo from server: NODE.JS Server \r\n');
    // socket.pipe(socket);
    // socket.end();
    // console.log('The client has disconnected...\n');
}).listen(8484, 'localhost');