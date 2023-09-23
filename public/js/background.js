class SignalEmitter extends EventTarget {
    emit(signal, args) {
        return this.dispatchEvent(new CustomEvent(signal, {detail: args}));
    }
}

const manager = new SignalEmitter();
const chatRoomMap = new Map(); // <Number, String>
chatRoomMap.set(0, 'Group Chat');

let ws = null;
let nickname = '';
let isClientConnected = false;
let focused = 0;

// class Signal {
//     static connect = new CustomEvent('connect', {detail: {name: nickname}});
//     static open = new CustomEvent('open', {detail: {name: nickname}});
//     static close = new CustomEvent('close', {detail: {name: nickname}});
//     static groupchat = new CustomEvent('groupchat', {detail: {name: nickname, payload: payload}});
//     static chatroom = new CustomEvent('chatroom', {detail: {name: nickname, payload: payload}});
//     static action = new CustomEvent('action', {detail: {name: nickname, payload: payload}});
// }

manager.addEventListener('connect', (e) => {

    ws = new WebSocket('ws://localhost:8080');

    ws.addEventListener('open', () => {
        isClientConnected = true;
        nickname = e.detail.name;
        manager.emit('open', {name: nickname});
    });

    ws.addEventListener('close', () => {
        if (!isClientConnected) return;
        else manager.emit('close', {name: nickname});
    });

    ws.addEventListener('message', (event) => {
        const payload = JSON.parse(event.data);
        if (payload.type === 'Initial') {
            for (const msg of payload.message) { manager.emit('chat', {name: nickname, payload: msg}); }
            manager.emit('action', {name: nickname, payload: payload})
        } else manager.emit((payload.type !== 'Message' ? 'action' : 'chat'), {name: nickname, payload: payload});
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

async function enterChatRoom(url, params) {
    fetch(url, {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify(params),
    }).then((response) => response.text())
    .then((data) => console.log(data));
}

function getFocused() {
    return focused;
}

function setFocused(num) {
    focused = num;
}

export {
    manager, chatRoomMap, sendMessage, getFocused, setFocused
}