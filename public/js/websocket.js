import handler from './handler.js';

let ws = null;
let nickname = '';
let isClientConnected = false;
let waitInviteReply = false;
let location = -1; // 0 = group chat, others = in chatroom

handler.on('connect', (str) => {

    ws = new WebSocket('ws://localhost:8080');

    ws.addEventListener('open', () => {
        isClientConnected = true;
        nickname = str;
        handler.emit('open', nickname);
    });

    ws.addEventListener('close', () => {
        if (!isClientConnected) return;
        else handler.emit('close', nickname);
    });

    ws.addEventListener('message', (event) => {
        const payload = JSON.parse(event.data);
        if (payload['type'] == 'Message') {
            if (payload['chatRoomId'] > 0) handler.emit('chatroom', payload, nickname);
            else handler.emit('groupchat', payload, nickname);
        } else handler.emit('message', payload);
    }
    );
});

handler.on('send', (type, receiver, message, chatRoomId) => {
    ws.send(JSON.stringify({
        'type': type,
        'sender': nickname,
        'receiver': receiver,
        'message': message,
        'chatRoomId': chatRoomId
    }));
});