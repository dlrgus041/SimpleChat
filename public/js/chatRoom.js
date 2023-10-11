import { manager, sendMessage, chatRoomMap, getFocused } from './worker.js';

// HTML elements
const chatArea = document.querySelector('#chatArea');
const memberArea = document.querySelector('#memberArea');
const toastArea = document.querySelector('#toastArea');

const chatForm = document.querySelector('#chatForm');
const alertForm = document.querySelector('#alertForm');
const memberForm = document.querySelector('#memberForm');
const modalForm = document.querySelector('#modalForm');
const toastForm = document.querySelector('#toastForm');

const chatRoomId = getFocused();

// functions
function displayAlert(type, message) {
    const node = alertForm.cloneNode(true);
    node.style.display = 'block';
    node.classList.add(`alert-${type}`);
    node.innerHTML = message;
    chatArea.appendChild(node);
};

function displayMessage(data) {

    const isMine = (data.payload.sender === data.name);
    const node = chatForm.cloneNode(true);
    
    node.style.display = 'block';
    node.style.textAlign = isMine ? 'right' : 'left';

    node.children[0].classList.add(isMine ? 'mine' : 'other');
    node.children[0].innerHTML = (isMine? '' : (data.payload.sender + ': ')) + data.payload.message;

    chatArea.appendChild(node);
};

function setEnablity(enablity, ...ids) {
    for (const id of ids) {
        document.querySelector(id).disabled = !enablity;
    }
}

function addMember(memberName) {
    const node = memberForm.cloneNode(true);
    node.style.display = 'block';
    node.children[0].children[0].children[0].innerHTML = memberName;
    memberArea.appendChild(node);
}

function displayModal(title, body, callback, singleBtn = false) {
    modalForm.children[0].children[0].children[0].children[0].innerHTML = title;
    modalForm.children[0].children[0].children[1].innerHTML = body;
    modalForm.children[0].children[0].children[2].children[0].addEventListener('click', callback, {once: true});
    modalForm.children[0].children[0].children[2].children[1].style.display = singleBtn ? 'none' : 'block';
    new bootstrap.Modal(modalForm).show();
}

function displayToast(body, callback = null) {
    
    const node = toastForm.cloneNode(true);
    if (callback !== null) {
        node.addEventListener('click', callback);
        node.style.curser = pointer;
    }

    node.children[0].children[0].innerHTML = body;
    toastArea.appendChild(node);
    bootstrap.Toast.getOrCreateInstance(node).show();
}

// addEventListener
document.querySelector('#send').addEventListener('click', () => {
    sendMessage('Message', null, document.querySelector('#message').value, chatRoomId);
    document.querySelector('#message').value = '';
});

// document.addEventListener("visibilitychange", () => {
//     if (document.visibilityState === 'visible') {
//         focusedChatRoom = chatRoomId;
//     }
// });

// manager
manager.addEventListener('chat', (e) => {
    if (e.detail.payload.chatRoomId == chatRoomId) displayMessage(e.detail);
    else if (document.visibilityState === 'visible') displayToast(`New message arrived from ${chatRoomMap.get(e.detail.payload.chatRoomId)}.`);
});

manager.addEventListener('action', (e) => {
    switch (e.detail.payload.type) {
        case 'Initial':
            setEnablity(true, '#members', '#message', '#send');
            break;
        // case 'Goodbye':
        //     displayAlert('warning', `${e.detail.payload.sender} left the Chat Server.`);
        //     break;
        // case 'Members':
        //     for (const members of e.detail.payload.message) {
        //         if (members.member === e.detail.name) continue;
        //         addMember(members.member);
        //     }
        //     progressbar.style.display = 'none';
        //     break;
        // case 'Whisper':
        //     displayAlert('secondary', `${e.detail.payload.sender} whispers to you: ${e.detail.payload.message}`);
        //     break;
        // case 'Invite':
        //     addChatRoom(e.detail.payload.chatRoomId);
        //     displayToast(
        //         e.detail.payload.sender === e.detail.payload.name
        //         ? `New chatroom with ${e.detail.payload.receiver} is created.`
        //         : `${e.detail.payload.receiver} invite you to new chatroom.`,
        //     );
        //     break;
        // case 'Create':
        //     addChatRoom(e.detail.payload.chatRoomId, e.detail.payload.sender);
        //     break;
    }
})

// initialize
// sendMessage('Initial', null, null, chatRoomId);