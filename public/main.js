// variables
var ws = null;
var nickname = '';
var isClientConnected = false;

// html elements
const groupChatArea = document.querySelector('#groupChatArea');
const memberArea = document.querySelector('#memberArea');
const chatRoomArea = document.querySelector('#chatRoomArea');
const toastArea = document.querySelector('#toastArea');

const groupChatForm = document.querySelector('#groupChatForm');
const alertForm = document.querySelector('#alertForm');
const memberForm = document.querySelector('#memberForm');
const chatRoomForm = document.querySelector('#chatRoomForm');
const modalForm = document.querySelector('#modalForm');
const toastForm = document.querySelector('#toastForm');

// functions
function displayAlert(type, message) {
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

function addMember(memberName) {

    const node = memberForm.cloneNode(true);
    node.style.display = 'block';

    node.children[0].children[0].children[0].innerHTML = memberName;
    node.children[0].children[1].children[0].addEventListener('click', () => {
        displayModal('invite', memberName);
        new bootstrap.Modal(modalForm).show();
    });
    node.children[0].children[1].children[1].addEventListener('click', () => {
        displayModal('whisper', memberName);
    });

    memberArea.appendChild(node);
}

function clearMember() {
    memberArea.textContent = '';
}

function addChatRoom(chatRoomName) {

    const node = chatRoomForm.cloneNode(true);
    node.style.display = 'block';

    node.children[0].children[0].children[0].innerHTML = chatRoomName;
    // node.children[0].children[1].children[0].addEventListener('click', () => {
    //     sendMessage(ws, 'Invite', nickname, member);
    // });
    // node.children[0].children[1].children[1].addEventListener('click', () => {
    //     sendMessage(ws, 'Whisper', nickname, member);
    // });

    chatRoomArea.appendChild(node);
}

function displayModal(type, receiver = null) {

    var title = '';
    var body = '';
    var callback = () => {};

    switch (type) {
        case 'closeServer':
            title = 'Disclamer';
            body = 'Connection will be lost. Continue?';
            callback = () => {
                try {
                    isClientConnected = false;
                    ws.close(1000, nickname);
                    ws = null;
                    nickname = '';
                    document.querySelector('#nickname').value = '';
                    setEnablity(true, '#connect', '#nickname', '#connect');
                    setEnablity(false, '#members', '#chatRooms', '#message', '#send');
                    displayAlert('warning', nickname + ', Connection closed. You can re-connect to server.');
                } catch (e) {
                    console.log('Error occured whlie close connection. \n\n' + e);
                }
            };
            break;
        case 'whisper':
            title = `Whisper to ${receiver}`;
            body = `<input id="whisperMessage" class="form-control ms-2 me-2" placeholder="Type message here">`;
            callback = () => {
                const message = document.querySelector('#whisperMessage').value;
                sendMessage(ws, 'Whisper', nickname, receiver, message);
                displayToast(`Succefully whispered to ${receiver}.`);
                displayAlert('secondary', `Whispers to ${receiver}: ${message}`);
            };
            break;
        case 'invite':
            title = 'Invite';
            body = `Invite ${receiver} to ChatRoom. Continue?`;
            callback = () => {
                sendMessage(ws, 'Invite', nickname, receiver);
                displayToast(`Send invitation to ${receiver}.`);
            };
            break;
        }

    modalForm.children[0].children[0].children[0].children[0].innerHTML = title;
    modalForm.children[0].children[0].children[1].innerHTML = body;
    modalForm.children[0].children[0].children[2].children[0].addEventListener('click', callback);

    new bootstrap.Modal(modalForm).show();
}

function displayToast(body) {
    const node = toastForm.cloneNode(true);
    node.children[0].innerHTML = body;
    toastArea.appendChild(node);
    bootstrap.Toast.getOrCreateInstance(node).show();
    
}
// listeners
document.querySelector('#connect').addEventListener('click', () => {

    if (document.querySelector('#nickname').value === '') {
        displayAlert('info', 'Please enter your nickname.');
        return;
    }

    try {
        ws = new WebSocket('ws://localhost:8080');

        ws.addEventListener('open', (event) => {
            isClientConnected = true;
            nickname = document.querySelector('#nickname').value;
            setEnablity(false, '#nickname', '#connect');
            setEnablity(true, '#members', '#chatRooms', '#message', '#send');
            displayAlert('success', `Welcomme to Group Chat Server, ${nickname}! You can close connection to click 'Close' button.`);
            sendMessage(ws, 'Welcome', nickname);
        });

        ws.addEventListener('close', (event) => {
            if (!isClientConnected) return;
            setEnablity(false, '#members', '#chatRooms', '#message', '#send');
            displayAlert('danger', `Server terminated. See you next time, ${nickname}!`);
        });

        ws.addEventListener('message', (event) => {

            const payload = JSON.parse(event.data);
            switch (payload['type']) {
                case 'Welcome':
                    displayAlert('success', `${payload['sender']} joins the Chat Server. Say Hello to ${payload['sender']}!`);
                    break;
                case 'Goodbye':
                    displayAlert('warning', `${payload['sender']} left the Chat Server.`);
                    break;
                case 'Message':
                    displayMessage(payload);
                    break;
                case 'Members':
                    for (const members of payload['message']) {
                        if (members['member'] === nickname) continue;
                        addMember(members['member']);
                    }
                    document.querySelector('#progress').style.display = 'none';
                    break;
                case 'Whisper':
                    displayAlert('secondary', `${payload['sender']} whispers to you: ${payload['message']} <a id="whisperReply">reply</a>`);
            }
        });
    } catch (e) {
        alert('Error occured whlie connect Server. \n\n' + e);
    }
});

// TODO: have to fix close & re-open connection with server
// document.querySelector('#closeServerTrigger').addEventListener('click', () => {
//     makeModal('closeServer');
//     const closeServerModal = new bootstrap.Modal(modalForm);
//     closeServerModal.show();
// });

document.querySelector('#send').addEventListener('click', () => {
    sendMessage(ws, 'Message', nickname, null, document.querySelector('#message').value);
    document.querySelector('#message').value = '';
});

document.querySelector('#members').addEventListener('click', () => {
    document.querySelector('#progress').style.display = 'block';
    sendMessage(ws, 'Members', nickname);
});

// initialize
displayAlert('info', 'To join in group chat server, please type your nickname above and click "Connect" button.');
// addMember('John Doe');
// addMember('Jane Doe');
addChatRoom('Chat Room 1');
addChatRoom('Chat Room 2');