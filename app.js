import express from 'express';
import session from 'express-session';
import signature from 'cookie-signature';
import { WebSocketServer } from 'ws';
import { StringDecoder } from 'string_decoder';
        
const app = express();
const secret = 'The quick brown fox jumps over the lazy dog.';

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(express.static('public'));
app.use(session({
    secret: secret,
    resave: false,
    saveUninitialized: true
  }));

app.set('view engine', 'ejs');
app.set('views', 'views');

app.listen(3000, () => {
    console.log('Example app listening on port 3000!');
});

app.get('/main', (req, res) => {
    res.render('main');
});

app.get('/chatroom', (req, res) => {
    res.send('It is the wrong approach. Please proceed again from the beginning.Sorry for the inconvenience in the use of the service. Please use the from scratch.')
})

app.post('/chatroom', (req, res) => {
    res.render('chatroom', req.body);
});

const wss = new WebSocketServer({ port: 8080 });

const websocketMap = new Map(); // <String, WebSocket>
const chatRoomMember = new Map(); // <Number, Set<String>>
const chatMessages = new Map(); // <Number, Array<JSON>>
const chatRoomName = new Map(); // <String, Map<Number, String>>
var id = 0;

function send(receiver, msg) {
    websocketMap.get(receiver).send(JSON.stringify(msg));
}

function broadcast(data) {
    for (const websocket of websocketMap.values()) {
        websocket.send(JSON.stringify(data));
    }
}

function toJSON(event, sender = null, receiver = null, message = null, chatroomID = 0) {
    return {
        event: event,
        sender: sender,
        receiver: receiver,
        message: message,
        chatroomID: chatroomID
    }
}

function saveMsg(data, chatroomID = 0) {
    chatMessages.get(chatroomID).push(data);
}

function restoreMsg(receiver, chatroomID) {
    send(receiver, toJSON('Initial', null, null, chatMessages.get(chatroomID), chatroomID))
}

wss.on('connection', (ws, req) => {

    ws.on('close', (code, reason) => {
        websocketMap.delete(reason.toString());
        broadcast(toJSON('Goodbye', reason.toString()));
    });
  
    ws.on('message', (rawdata) => {
        const data = JSON.parse(rawdata);
        switch (data.event) {
            case 'Initial':
                if (data.chatroomID == 0) websocketMap.set(data.sender, ws);
                restoreMsg(data.sender, data.chatroomID);
                break;
            case 'Welcome':
                broadcast(data);
                break;
            case 'Chat':
                if (data.receiver === 'server') {
                    saveMsg(data);
                } else if (data.chatroomID == 0) {
                    broadcast(data);
                    saveMsg(data);
                } else {
                    for (const member of chatRoomMember.get(data.chatroomID)) {
                        send(member, data);
                    }
                    saveMsg(data, data.chatroomID);
                }
                break;
            case 'Members':
                data.message = [];
                for (const member of (data.chatroomID > 0 ? chatRoomMember.get(data.chatroomID) : websocketMap.keys())) {
                    data.message.push({ member : member });
                }
                send(data.sender, data);
                break;
            case 'Whisper':
                send(data.receiver, data);
                send(data.sender, data);
                break;
            case 'Invite':
                data.chatroomID = ++id;
                chatMessages.set(data.chatroomID, []);
                chatRoomMember.set(data.chatroomID, new Set([data.sender, data.receiver]));
                send(data.sender, data);
                send(data.receiver, data);
                break;
            // case 'Leave':
            //     chatRoomMember.get(data.chatroomID).delete(data.sender);
            //     if (chatRoomMember.get(data.chatroomID).size != 0) {
            //         for (const member of chatRoomMember.get(data.chatroomID)) { send(member, data) }
            //     } else chatRoomMember.delete(data.chatroomID);
            //     break;
        }
    });
});

// initailize
chatMessages.set(0, []);