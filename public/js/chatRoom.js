import Form from './Form.js';

// HTML elements
const chatArea = document.querySelector('#chatArea');
const memberArea = document.querySelector('#memberArea');
const toastArea = document.querySelector('#toastArea');

const chatForm = document.querySelector('#chatForm');
const alertForm = document.querySelector('#alertForm');
const memberForm = document.querySelector('#memberForm');
const modalForm = document.querySelector('#modalForm');
const toastForm = document.querySelector('#toastForm');

const bc = new BroadcastChannel('channel');
const chatroomID = parseInt(localStorage.getItem('focus'));

// functions
function send(event, receiver = null, message = null) {
    bc.postMessage(new Form(event, receiver, message, chatroomID));
}

function displayAlert(type, message) {
    const node = alertForm.cloneNode(true);
    node.style.display = 'block';
    node.classList.add(`alert-${type}`);
    node.innerHTML = message;
    chatArea.appendChild(node);
};

function displayMessage(data) {
    
    const isMine = (data.sender === localStorage.getItem('nickname'));
    const node = chatForm.cloneNode(true);
    
    node.style.display = 'block';
    node.style.textAlign = isMine ? 'right' : 'left';

    node.children[0].classList.add(isMine ? 'mine' : 'other');
    node.children[0].innerHTML = (isMine? '' : (data.sender + ': ')) + data.message;

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

function clearMember() {
    memberArea.textContent = '';
}

function displayModal(title, body, callback, singleBtn = false) {
    modalForm.children[0].children[0].children[0].children[0].innerHTML = title;
    modalForm.children[0].children[0].children[1].innerHTML = body;
    modalForm.children[0].children[0].children[2].children[0].addEventListener('click', callback, {once: true});
    modalForm.children[0].children[0].children[2].children[1].style.display = singleBtn ? 'none' : 'block';
    new bootstrap.Modal(modalForm, {backdrop: 'static', keyboard: false}).show();
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
    send('Chat', null, document.querySelector('#message').value, chatroomID);
    document.querySelector('#message').value = '';
});

document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === 'visible') {
        localStorage.setItem('focus', chatroomID);
    }
});

// BroadcastChannel
bc.addEventListener('message', (e) => {
    if (e.data.event === 'Chat') {
        if (e.data.chatroomID === chatroomID) displayMessage(e.data);
        else if (document.visibilityState === 'visible') displayToast(`New message arrived from ${chatRoomNameMap.get(e.data.chatroomID)}.`);
    } else if (e.data.chatroomID === chatroomID) {
        switch (e.data.event) {
            case 'Initial':
                setEnablity(true, '#members', '#message', '#send');
                displayAlert('success', 'Welcome to private chatroom.')
                break;
            case 'Members':
                for (const members of e.data.message) {
                    if (members.member === localStorage.getItem('nickname')) continue;
                    addMember(members.member);
                }
                progressbar.style.display = 'none';
                break;
        }
    }
});

// initialize
send('Initial');