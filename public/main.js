var ws = null;
var nickname = '';
var isClientConnected = false;
const chatArea = document.querySelector('#chatArea');
const memberArea = document.querySelector('.offcanvas-body');
const participant = document.querySelector('.participant');

function setEnablity(enablity, ...ids) {
    for (const id of ids) {
        document.querySelector(id).disabled = !enablity;
    }
}

function chatAlert(type, message) {
    const node = document.createElement('div');
    node.className = `alert alert-${type}`;
    node.role = 'alert';
    node.innerHTML = message;
    node.style.textAlign = 'center';
    chatArea.appendChild(node);
};

function sendMessage(websocket, type, sender, receiver = null, message = null) {
    websocket.send(JSON.stringify({
        'type': type,
        'sender': sender,
        'receiver': receiver,
        'message': message
    }));
}

function displayMessage(payload) {

    const isMine = (payload['sender'] === nickname);

    const inner = document.createElement('div');
    inner.style.display = 'inline';
    inner.className = 'inner ' + (isMine ? 'mine' : 'other');
    inner.innerHTML = (isMine ? '' : (payload['sender'] + ': ')) + payload['message'];

    const outer = document.createElement('div');
    outer.style.textAlign = isMine ? 'right' : 'left';
    outer.className = 'outer';
    outer.appendChild(inner);

    chatArea.appendChild(outer);
};

document.querySelector('#connect').addEventListener('click', () => {
    try {
        ws = new WebSocket('ws://localhost:8080');

        ws.addEventListener('open', (event) => {
            isClientConnected = true;
            nickname = document.querySelector('#nickname').value;
            setEnablity(false, '#nickname', '#connect');
            setEnablity(true, '#participants', '#trigger', '#message', '#send');
            chatAlert('success', `Welcomme to Chat Server, ${nickname}!`);
            sendMessage(ws, 'Welcome', nickname);
        });

        ws.addEventListener('close', (event) => {
            if (!isClientConnected) return;
            setEnablity(false, '#participants', '#trigger', '#message', '#send');
            chatAlert('danger', `Server terminated. See you next time, ${nickname}!`);
        });

        ws.addEventListener('message', (event) => {

            const payload = JSON.parse(event.data);
            switch (payload['type']) {
                case 'Welcome':
                    // addPrtcpnt(payload['sender']);
                    chatAlert('success', `${payload['sender']} joins the Chat Server. Say Hello to ${payload['sender']}!`);
                    break;
                case 'Goodbye':
                    chatAlert('warning', `${payload['sender']} left the Chat Server.`);
                    break;
                case 'Message':
                    displayMessage(payload);
                    break;
            }
        });

        function addPrtcpnt(prtcpnt) {

            const node = participant.cloneNode(true);
            node.style.display = 'block';

            node.children[0].children[0].children[0].innerHTML = prtcpnt;
            node.children[0].children[1].children[0].addEventListener('click', () => {
                sendMessage(ws, 'Invite', nickname, prtcpnt);
            });
            node.children[0].children[1].children[1].addEventListener('click', () => {
                sendMessage(ws, 'Whisper', nickname, prtcpnt);
            });

            memberArea.appendChild(node);
        }
    } catch (e) {
        alert('Error occured whlie connect Server. \n\n' + e);
    }
});

document.querySelector('#close').addEventListener('click', () => {
    try {
        isClientConnected = false;
        ws.close(1000, nickname);
        ws = null;
        nickname = '';
        document.querySelector('#nickname').value = '';
        setEnablity(true, '#connect', '#nickname', '#connect');
        setEnablity(false, '#participants', '#trigger', '#message', '#send');
        chatAlert('warning', 'Connection closed. You can re-connect to server.');
    } catch (e) {
        alert('Error occured whlie close connection. \n\n' + e);
    }
});

document.querySelector('#send').addEventListener('click', () => {
    sendMessage(ws, 'Message', nickname, null, document.querySelector('#message').value);
    document.querySelector('#message').value = '';
});