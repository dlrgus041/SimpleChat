const manager = new EventTarget();
const chatRoomMap = new Map(); // <Number, Element>

let ws = null;
let nickname = '';
let payload = {};
let isClientConnected = false;
let waitInviteReply = false;
let location = -1; // 0 = group chat, others = in chatroom

class Signal {
    static connect = new CustomEvent('connect', {detail: {name: nickname}});
    static open = new CustomEvent('open', {detail: {name: nickname}});
    static close = new CustomEvent('close', {detail: {name: nickname}});
    static groupchat = new CustomEvent('groupchat', {detail: {name: nickname, payload: payload}});
    static chatroom = new CustomEvent('chatroom', {detail: {name: nickname, payload: payload}});
    static action = new CustomEvent('action', {detail: {name: nickname, payload: payload}});
}

manager.addEventListener('connect', (e) => {

    ws = new WebSocket('ws://localhost:8080');

    ws.addEventListener('open', () => {
        isClientConnected = true;
        nickname = e.detail.name;
        manager.dispatchEvent(Signal.open);
    });

    ws.addEventListener('close', () => {
        if (!isClientConnected) return;
        else manager.dispatchEvent(Signal.close);
    });

    ws.addEventListener('message', (event) => {
        copy(JSON.parse(event.data));
        manager.dispatchEvent(payload.type !== 'Message' ? Signal.action : payload.chatRoomId > 0 ? Signal.groupchat : Signal.chatroom);
    });
});

function sendMessage(type, receiver = null, message = null, chatRoomId = 0) {
    ws.send(JSON.stringify({
        type: type,
        sender: nickname,
        receiver: receiver,
        message: message,
        chatRoomId: chatRoomId
    }));
};

function copy(obj) {
    if(typeof obj !== "object" || obj === null) return obj;
    
    ret = {};    
    for(const key in obj) ret[key] = copy(obj[key]);
    return ret;
}

export {
    manager, chatRoomMap, sendMessage, Signal
};