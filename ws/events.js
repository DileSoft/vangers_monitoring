const WebSocket = require('ws');
const fs = require('fs');

const wss = new WebSocket.Server({ port: 8088 });

let prev = '';
let results = {
};
wss.on('connection', function connection(ws) {
    
    ws.send(prev);
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

var net = require('net');
var server = net.createServer(function(socket) {
    socket.on('data', function(data) {
        // broadcast(data.toString('utf8'));
        let json = JSON.parse(data.toString('utf8'));
        if (json.game && json.player) {
            if (!results[json.game.uuid]) {
                results[json.game.uuid] = {
                    name: json.game.name,
                    players: {}
                };
            }
            if (!results[json.game.uuid].players[json.player.ID]) {
                results[json.game.uuid].players[json.player.ID] = {
                    time_in_world: 0,
                    set_world_time: json.time,
                    last_check_point_world_time: 0,
                    checkpoints: []
                }
            }
            let player_data = results[json.game.uuid].players[json.player.ID];
            if (json.name === 'SET_WORLD') {
                player_data.set_world_time = json.time;
            }
            if (json.name === 'LEAVE_WORLD') {
                player_data.time_in_world += json.time - player_data.set_world_time;
                player_data.set_world_time = json.time;
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
            results[json.game.uuid].name = json.game.name;
        }
        broadcast(JSON.stringify(results));
    });
}).listen(8488, 'localhost');
console.log('Server started');