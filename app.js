import express from 'express';
import session from 'express-session';
import signature from 'cookie-signature';
import { WebSocketServer } from 'ws';
import { StringDecoder } from 'string_decoder';

import Payload from './form/Payload.js';
import UserRoomInfo from './form/UserRoomInfo.js';
import ChatroomData from './form/ChatroomData.js';
        
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
const userRoomInfoMap = new Map(); // <String, Map<Number, UserRoomInfo>>
const chatroomDataMap = new Map(); // <Number, chatroomData>
var id = 0;

function sendPayload(payload, member) {
    websocketMap.get(member).send(JSON.stringify(payload));
}

function broadcast(payload, chatroomID = 0) {
    for (const member of chatroomDataMap.get(chatroomID).getMembers()) {
        if (chatroomID === 0 || websocketMap.has(member)) sendPayload(payload, member);
        else userRoomInfoMap.get(member).get(chatroomID).unreadCount += 1;
    }
}

wss.on('connection', (ws, req) => {

    ws.on('close', (code, reason) => {
        websocketMap.delete(reason.toString());
        broadcast(new Payload('Goodbye', reason.toString()));
    });
  
    ws.on('message', (rawdata) => {
        const data = JSON.parse(rawdata);
        switch (data.event) {
            case 'Initial':
                if (data.chatroomID === 0) {
                    websocketMap.set(data.sender, ws);
                    if (userRoomInfoMap.has(data.sender)) {
                        for (const [chatroomID, userRoomInfo] of userRoomInfoMap.get(data.sender)) { data.receiver.push({chatroomID: chatroomID, userRoomInfo: userRoomInfo}); }
                    } else userRoomInfoMap.set(data.sender, new Map());
                }
                data.message = chatroomDataMap.get(data.chatroomID).getMessages();
                sendPayload(data, data.sender);
                break;
            case 'Welcome':
                broadcast(data);
                break;
            case 'Chat':
                chatroomDataMap.get(data.chatroomID).storeMessage(data);
                broadcast(data, data.chatroomID);
                break;
            case 'Members':
                data.message = [];
                for (const member of chatroomDataMap.get(data.chatroomID).getMembers()) { data.message.push(member); }
                sendPayload(data, data.sender);
                break;
            case 'Whisper':
                sendPayload(data, data.sender);
                sendPayload(data, data.receiver);
                break;
            case 'Invite': // have to consider: if 'data.sender' already have chatroom with 'data.receiver'.
                // if (chatroomMember.has(data.chatroomID)) {
                //     data.message = `Chatroom with ${data.receiver} already exist.`;
                //     sendPayload(data.sender, data);
                // } else {
                    data.chatroomID = ++id;
                    userRoomInfoMap.get(data.sender).set(data.chatroomID, new UserRoomInfo(data.receiver));
                    userRoomInfoMap.get(data.receiver).set(data.chatroomID, new UserRoomInfo(data.sender));
                    chatroomDataMap.set(data.chatroomID, new ChatroomData(data.sender, data.receiver));
                    sendPayload(data, data.sender);
                    sendPayload(data, data.receiver);
                // }
                break;
            // case 'Leave':
            //     chatroomMember.get(data.chatroomID).delete(data.sender);
            //     if (chatroomMember.get(data.chatroomID).size != 0) {
            //         for (const member of chatroomMember.get(data.chatroomID)) { sendPayload(member, data) }
            //     } else chatroomMember.delete(data.chatroomID);
            //     break;
        }
    });
});

// initailize
chatroomDataMap.set(0, new ChatroomInfo('Group Chat'));