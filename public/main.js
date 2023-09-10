// variables

var ws = null;
var nickname = '';
var isClientConnected = false;

// html elements
const groupChatArea = document.querySelector('#groupChatArea');
const groupChatForm = document.querySelector('#groupChatForm');
const alertForm = document.querySelector('#alertForm');

const memberArea = document.querySelector('#memberArea');
const memberForm = document.querySelector('#memberForm');

const ChatRoomArea = document.querySelector('#ChatRoomArea');
const ChatRoomForm = document.querySelector('#ChatRoomForm');


// functions
function displyAlert(type, message) {
    const node = alertForm.cloneNode(true);
    node.style.display = 'block';
    node.classList.add(`alert-${type}`);
    node.innerHTML = message;
    groupChatArea.appendChild(node);
};

function displayMessage(payload) {
    const isMine = (payload['sender'] === nickname);

    const node = groupChatForm.cloneNode(true);
    node.style.display = 'block';
    node.style.textAlign = isMine ? 'right' : 'left';

    node.children[0].classList.add(isMine ? 'mine' : 'other');
    node.children[0].innerHTML = (isMine? '' : (payload['sender'] + ': ')) + payload['message'];

    groupChatArea.appendChild(node);
};

function setEnablity(enablity, ...ids) {
    for (const id of ids) {
        document.querySelector(id).disabled = !enablity;
    }
}

function sendMessage(websocket, type, sender, receiver = null, message = null) {
    websocket.send(JSON.stringify({
        'type': type,
        'sender': sender,
        'receiver': receiver,
        'message': message
    }));
}

function addMember(member) {

    const node = participant.cloneNode(true);
    node.style.display = 'block';

    node.children[0].children[0].children[0].innerHTML = prtcpnt;
    node.children[0].children[1].children[0].addEventListener('click', () => {
        sendMessage(ws, 'Invite', nickname, member);
    });
    node.children[0].children[1].children[1].addEventListener('click', () => {
        sendMessage(ws, 'Whisper', nickname, member);
    });

    memberArea.appendChild(node);
}

function addChatRoom(chatRoom) {

}

// listeners
document.querySelector('#connect').addEventListener('click', () => {
    try {
        ws = new WebSocket('ws://localhost:8080');

        ws.addEventListener('open', (event) => {
            isClientConnected = true;
            nickname = document.querySelector('#nickname').value;
            setEnablity(false, '#nickname', '#connect');
            setEnablity(true, '#members', '#chatRooms', '#trigger', '#message', '#send');
            displyAlert('success', `Welcomme to Group Chat Server, ${nickname}! You can close connection to click 'Close' button.`);
            sendMessage(ws, 'Welcome', nickname);
        });

        ws.addEventListener('close', (event) => {
            if (!isClientConnected) return;
            setEnablity(false, '#members', '#chatRooms', '#trigger', '#message', '#send');
            displyAlert('danger', `Server terminated. See you next time, ${nickname}!`);
        });

        ws.addEventListener('message', (event) => {

            const payload = JSON.parse(event.data);
            switch (payload['type']) {
                case 'Welcome':
                    displyAlert('success', `${payload['sender']} joins the Chat Server. Say Hello to ${payload['sender']}!`);
                    break;
                case 'Goodbye':
                    displyAlert('warning', `${payload['sender']} left the Chat Server.`);
                    break;
                case 'Message':
                    displayMessage(payload);
                    break;
                case 'Members':
                    for (const member of payload['message']) {
                        addMember(member);
                    }
                    document.querySelector('#progress').style.display = 'none';
                    break;
            }
        });
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
        setEnablity(false, '#members', '#chatRooms', '#trigger', '#message', '#send');
        displyAlert('warning', 'Connection closed. You can re-connect to server.');
    } catch (e) {
        alert('Error occured whlie close connection. \n\n' + e);
    }
});

document.querySelector('#send').addEventListener('click', () => {
    sendMessage(ws, 'Message', nickname, null, document.querySelector('#message').value);
    document.querySelector('#message').value = '';
});

document.querySelector('#members').addEventListener('click', () => {
    document.querySelector('#progress').style.display = 'block';
    sendMessage(ws, 'Members', nickname);
});

// initialize
displyAlert('info', 'To join in group chat server, please type your nickname above and click "Connect" button.');