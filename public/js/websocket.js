import manager from './manager.js';

let ws = null;
let nickname = '';
let isClientConnected = false;
let waitInviteReply = false;
let location = -1; // 0 = group chat, others = in chatroom

manager.addEventListener('connect', (e) => {

    ws = new WebSocket('ws://localhost:8080');

    ws.addEventListener('open', () => {
        isClientConnected = true;
        nickname = e.detail.name;
        manager.dispatchEvent(new CustomEvent('open', {
            detail: {
                name: nickname
            }
        }));
    });

    ws.addEventListener('close', () => {
        if (!isClientConnected) return;
        else manager.dispatchEvent(new CustomEvent('close', {
            detail: {
                name: nickname
            }
        }));
    });

    ws.addEventListener('message', (event) => {
        const payload = JSON.parse(event.data);
        manager.dispatchEvent(new CustomEvent(
            payload.type !== 'Message' ? 'action' : payload.chatRoomId > 0 ? 'chatroom' : 'groupchat',
            {
                detail: {
                    payload: payload,
                    name: nickname
                }
            }
        ));
    });
});

manager.addEventListener('send', (e) => {
    ws.send(JSON.stringify({
        type: e.detail.type,
        sender: nickname,
        receiver: e.detail.receiver,
        message: e.detail.message,
        chatRoomId: e.detail.chatRoomId
    }));
});

export default manager;