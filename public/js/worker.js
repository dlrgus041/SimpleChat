import WPayload from "./form/WPayload.js";
import UserRoomInfo from "./form/UserRoomInfo.js";

const bc = new BroadcastChannel('channel');
const ws = new WebSocket('ws://localhost:8080');
const userRoomInfoMap = new Map(); // <Number, UserRoomInfo>

ws.addEventListener('open', () => {
    postMessage(new WPayload('Open'));
});

ws.addEventListener('close', () => {
    bc.postMessage(new WPayload('Close'));
});

ws.addEventListener('message', (e) => {
    console.log('from server to client: ' + e.data);
    const payload = JSON.parse(e.data);
    if (payload.event === 'Initial') {
        for (const msg of payload.message) { bc.postMessage(msg); }
        for (const init of payload.receiver) { userRoomInfoMap.set(init.chatroomID, init.userRoomInfo) }
        bc.postMessage({event: 'Initial', chatroomID: payload.chatroomID});
    } else bc.postMessage(payload);
});

bc.addEventListener('message', (e) => {
    console.log('from client to server: ' + JSON.stringify(e.data));
    ws.send(JSON.stringify(e.data));
});

addEventListener('message', (e) => {

});