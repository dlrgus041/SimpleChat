import elements from "./elements.js";

function displayAlert(type, message) {
    const node = elements.alertForm.cloneNode(true);
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

    elements.groupChatArea.appendChild(node);
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

    const node = elements.memberForm.cloneNode(true);
    node.style.display = 'block';

    node.children[0].children[0].children[0].innerHTML = memberName;
    node.children[0].children[1].children[0].addEventListener('click', () => {
        displayModal('invite', memberName);
    });
    node.children[0].children[1].children[1].addEventListener('click', () => {
        displayModal('whisper', memberName);
    });

    elements.memberArea.appendChild(node);
}

function clearMember() {
    elements.memberArea.textContent = '';
}

function addChatRoom(chatRoomName) {

    const node = elements.chatRoomForm.cloneNode(true);
    node.style.display = 'block';

    node.children[0].children[0].children[0].innerHTML = chatRoomName;
    // node.children[0].children[1].children[0].addEventListener('click', () => {
    //     sendMessage(ws, 'Invite', nickname, member);
    // });
    // node.children[0].children[1].children[1].addEventListener('click', () => {
    //     sendMessage(ws, 'Whisper', nickname, member);
    // });

    elements.chatRoomArea.appendChild(node);
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

    elements.modalForm.children[0].children[0].children[0].children[0].innerHTML = title;
    elements.modalForm.children[0].children[0].children[1].innerHTML = body;
    elements.modalForm.children[0].children[0].children[2].children[0].addEventListener('click', callback);

    new bootstrap.Modal(elements.modalForm).show();
}

function displayToast(body) {
    const node = elements.toastForm.cloneNode(true);
    node.children[0].innerHTML = body;
    elements.toastArea.appendChild(node);
    bootstrap.Toast.getOrCreateInstance(node).show();    
}

export default {
    displayAlert,
    displayMessage,
    setEnablity,
    sendMessage,
    addMember,
    clearMember,
    addChatRoom,
    displayModal,
    displayToast
};