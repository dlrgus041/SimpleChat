import express from 'express';
import jade from 'jade';
import { WebSocketServer } from 'ws';
import { StringDecoder } from 'string_decoder';
        
const app = express();

app.use(express.static('public'));
app.set('view engine', 'jade');

app.listen(3000, () => {
    console.log('Example app listening on port 3000!');
});

app.get('/hello', (req, res) => {
    res.render('hello');
});

const wss = new WebSocketServer({ port: 8080 });
const decoder = new StringDecoder('utf8');

const map = new Map();

wss.on('connection', (ws) => {

    function broadcast(data) {
        for (const conn of map.keys()) {
            conn.send(data);
        }
    }

    ws.on('close', () => {
        const name = map.get(ws);
        map.delete(ws);
        broadcast('Goodbye:' + name);
    });
  
    ws.on('message', (rawdata) => {
        const data = decoder.write(new Buffer(rawdata));
        broadcast(data);

        const arr = data.split(':');
        if (arr[0] === 'Welcome') {
            map.set(ws, arr[1]);
        }
    });
});