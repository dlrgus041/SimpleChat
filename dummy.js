import express from 'express';
import { StringDecoder } from 'string_decoder';
        
const app = express();

app.use(express.static('public'));
app.set('view engine', 'ejs');
app.set('views', 'views');

app.listen(3000, () => {
    console.log('Example app listening on port 3000!');
});

app.get('/chat', (req, res) => {
    res.render('chatRoom');
});

const wss = new WebSocketServer({ port: 8080 });
const decoder = new StringDecoder('utf8');

const map = new Map();
const chatRooms = new Map();
var id = 1;

function broadcast(data) {
    for (const websocket of map.values()) {
        websocket.send(JSON.stringify(data));
    }
}

function serialize(type, sender, receiver = null, message = null, chatRoomId = 0) {
    return JSON.stringify({
        'type': type,
        'sender': sender,
        'receiver': receiver,
        'message': message,
        'chatRoomId': chatRoomId
    })
}

wss.on('connection', (ws) => {

    ws.on('close', (code, reason) => {
        map.delete(reason.toString());
        broadcast(serialize('Goodbye', reason.toString()));
    });
  
    ws.on('message', (rawdata) => {
        const data = JSON.parse(rawdata);
        switch (data['type']) {
            case 'Welcome':
                broadcast(data);
                map.set(data['sender'], ws);
                break;
            case 'Message':
                broadcast(data);
                break;
            case 'Members':
                data['message'] = [];
                for (const member of map.keys()) {
                    data['message'].push({ 'member' : member });
                }
                map.get(data['sender']).send(JSON.stringify(data));
                break;
            case 'Whisper':
                map.get(data['receiver']).send(JSON.stringify(data));
                break;
            case 'Invite':
                map.get(data['receiver']).send(JSON.stringify(data));
                break;
            case 'Accept':
                chatRooms.set(id, [data['sender'], data['receiver']]);
                map.get(data['sender']).send(serialize('Create', data['receiver']));
                map.get(data['receiver']).send(serialize('Create', data['sender']));
                break;
        }
    });
});