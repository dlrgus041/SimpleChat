import UserRoomInfo from "./form/UserRoomInfo.js";
import Payload from "./form/Payload.js";

const bc = new BroadcastChannel('channel');
const ws = new WebSocket('ws://localhost:8080');
const userRoomInfoMap = new Map(); // <Number, UserRoomInfo>

function addUserRoomInfo(chatroomID, chatroomName, unreadCount = 0) {
    userRoomInfoMap.set(chatroomID, new UserRoomInfo(chatroomName, unreadCount));
}

function getChatroomName(chatroomID) {
    return userRoomInfoMap.get(chatroomID).chatroomName;
}

function getUnreadCount(chatroomID) {
    return userRoomInfoMap.get(chatroomID).unreadCount;
}

ws.addEventListener('open', () => {
    postMessage(new Payload('Open'));
});

ws.addEventListener('close', () => {
    bc.postMessage(new Payload('Close'));
});

ws.addEventListener('message', (e) => {
    console.log('from server to client: ' + e.data);
    const payload = JSON.parse(e.data);
    if (payload.event === 'Initial') {
        for (const msg of payload.message) { bc.postMessage(msg); }
        for (const init of payload.receiver) { addUserRoomInfo(init.chatroomID, init.userRoomInfo.chatroomName, init.userRoomInfo.unreadCount); }
        bc.postMessage(new Payload('Initial', payload.receiver.length === 0, null, payload.chatroomID));
    } else if (payload.event === 'Invite') {
        addUserRoomInfo(payload.chatroomID, e.data.sender === localStorage.getItem('nickname') ? payload.receiver : payload.sender);
        postMessage(payload);
    } else if (payload.event === 'Chat' || payload.event === 'Members') bc.postMessage(payload);
    else postMessage(payload);
});

bc.addEventListener('message', (e) => {
    console.log('from client to server: ' + JSON.stringify(e.data));
    ws.send(JSON.stringify(e.data));
});

addEventListener('message', (e) => {

});