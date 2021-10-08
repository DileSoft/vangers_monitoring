const WebSocket = require('ws');
const fs = require('fs');

const wss = new WebSocket.Server({ port: 8088 });

let prev = '';
let results = {
};
wss.on('connection', function connection(ws) {
    ws.send(JSON.stringify({results, event: null}));
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

results = JSON.parse(fs.readFileSync(__dirname + '/events_history.json').toString('utf-8'));
setInterval(() => {
    fs.writeFile(__dirname + '/events_history.json', JSON.stringify(results), ()=>{});
}, 1000);

var net = require('net');
var server = net.createServer(function(socket) {
    socket.on('data', function(data) {
        // broadcast(data.toString('utf8'));
        let json = JSON.parse(data.toString('utf8'));
        if (json.game && json.player) {
            if (!results[json.game.uuid]) {
                results[json.game.uuid] = {
                    name: json.game.name,
                    players: {},
                    chat: []
                };
            }
            let result_game = results[json.game.uuid];
            if (!result_game.players[json.player.ID]) {
                result_game.players[json.player.ID] = {
                    time_in_world: 0,
                    set_world_time: json.time,
                    last_check_point_world_time: 0,
                    checkpoints: []
                }
            }
            let player_data = result_game.players[json.player.ID];
            if (json.name === 'SET_WORLD') {
                player_data.set_world_time = json.time;
            }
            if (json.name === 'LEAVE_WORLD') {
                player_data.time_in_world += json.time - player_data.set_world_time;
                player_data.set_world_time = json.time;
            }
            if (json.name === 'DIRECT_SENDING') {
                if (!result_game.chat) {
                    result_game.chat = [];
                }
                result_game.chat.push({
                    time: json.time,
                    text: json.message,
                    player_id: json.player.ID,
                    player_name: json.player.name,
                })
            }
            if (json.player.statistics && json.player.statistics.CheckpointLighting) {
                if (json.player.statistics.CheckpointLighting > player_data.checkpoints.length) {
                    let checkpoint_time_in_world = player_data.time_in_world + json.time - player_data.set_world_time;
                    player_data.checkpoints.push({
                        time: checkpoint_time_in_world - player_data.last_check_point_world_time
                    });

                    player_data.last_check_point_world_time = checkpoint_time_in_world;
                }
            }
            player_data.name = json.player.name;
            result_game.name = json.game.name;
        }
        broadcast(JSON.stringify({results, event: json}));
    });
}).listen(8488, 'localhost');
console.log('Server started');