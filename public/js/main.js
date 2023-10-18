import Payload from './form/Payload.js';
import WPayload from './form/WPayload.js';

const bc = new BroadcastChannel('channel');
let worker = null;

// HTML elements
const groupChatArea = document.querySelector('#groupChatArea');
const memberArea = document.querySelector('#memberArea');
const chatroomArea = document.querySelector('#chatroomArea');
const toastArea = document.querySelector('#toastArea');

const groupChatForm = document.querySelector('#groupChatForm');
const alertForm = document.querySelector('#alertForm');
const memberForm = document.querySelector('#memberForm');
const chatroomForm = document.querySelector('#chatroomForm');
const modalForm = document.querySelector('#modalForm');
const toastForm = document.querySelector('#toastForm');

const memberProgress = document.querySelector('#progress');

// functions

function post(event, data) {
    worker?.postMessage(new WPayload(event, data));
}

function send(event, receiver = null, message = null) {
    bc.postMessage(new Payload(event, receiver, message, 0));
}

function displayAlert(type, message) {
    const node = alertForm.cloneNode(true);
    node.style.display = 'block';
    node.classList.add(`alert-${type}`);
    node.innerHTML = message;
    groupChatArea.appendChild(node);
};

function displayMessage(data) {
    
    const isMine = (data.sender === localStorage.getItem('nickname'));
    const node = groupChatForm.cloneNode(true);
    
    node.style.display = 'block';
    node.style.textAlign = isMine ? 'right' : 'left';

    node.children[0].classList.add(isMine ? 'mine' : 'other');
    node.children[0].innerHTML = (isMine? '' : (data.sender + ': ')) + data.message;

    groupChatArea.appendChild(node);
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

    node.children[0].children[1].children[0].addEventListener('click', () => {
        displayModal(
            `Invite ${memberName}`,
            `New chatroom will be made and invite ${memberName}. Continue?`,
            () => { send('Invite', memberName); }
        );
    });

    node.children[0].children[1].children[1].addEventListener('click', () => {
        displayModal(
            `Whisper to ${memberName}`,
            `<input id="whisperMessage" class="form-control" placeholder="Type whisper message here">`,
            () => { send('Whisper', memberName, document.querySelector('#whisperMessage').value); }
        );
    });

    memberArea.appendChild(node);
}

function clearMember() {
    memberArea.textContent = '';
}

function addChatRoom(chatroomID) {

    const node = chatroomForm.cloneNode(true);
    node.style.display = 'block';

    node.addEventListener('click', () => {
        localStorage.setItem('focus', chatroomID);
        updateUnreadCount(chatroomID, true);
        enterChatRoom('/chatroom', {chatroomID: chatroomID, chatroomName: chatroomNameMap.get(chatroomID)});
    });

    node.children[0].children[0].children[0].innerHTML = `${chatroomNameMap.get(chatroomID)}  <span class="badge text-bg-secondary">unreadCount</span>`;
    node.children[0].children[1].children[0].addEventListener('click', () => { send('Members', null, null, chatroomID); });

    node.children[0].children[1].children[1].addEventListener('click', () => {
        displayModal(
            'Warning',
            `All messages in ${chatroomNameMap.get(chatroomID)} will be deleted. Are you sure?`,
            () => { send('Leave', chatroomID); }
        )
    });

    chatroomArea.appendChild(node);
}

function removeChatRoom(chatroomID) {
    chatroomMap.get(chatroomID).remove();
    chatroomMap.delete(chatroomID);
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

// using 'form' tag to send POST message
function enterChatRoom(url, params) {

    var form = document.createElement('form');
    form.setAttribute('method', 'post');
    form.setAttribute('target', '_blank');
    form.setAttribute('action', url);

    for (var key in params) {
      var hiddenField = document.createElement('input');
      hiddenField.setAttribute('type', 'hidden');
      hiddenField.setAttribute('name', key);
      hiddenField.setAttribute('value', params[key]);
      form.appendChild(hiddenField);
    }

    document.body.appendChild(form);
    form.submit();
}

// addEventListener
document.querySelector('#send').addEventListener('click', () => {
    send('Chat', null, document.querySelector('#message').value);
    document.querySelector('#message').value = '';
});

document.querySelector('#members').addEventListener('click', () => {
    clearMember();
    memberArea.appendChild(memberProgress);
    memberProgress.style.display = 'block';
    send('Members');
});

document.addEventListener("visibilitychange", () => {
    if (document.visibilityState == 'visible') {
        localStorage.setItem('focus', 0);
    }
});

addEventListener('beforeunload', (e) => {
    e.preventDefault();
    displayModal(
        'Warning',
        'Are you sure that you want to leave chat server?',
        () => {}
    );
});

// BroadcastChannel
bc.addEventListener('message', (e) => {

    function isMine() {
        return e.data.sender === localStorage.getItem('nickname');
    }

    switch (e.data.event) {
        case 'Chat':
            if (e.data.chatroomID === 0) displayMessage(e.data);
            else {
                if (e.data.chatroomID !== parseInt(localStorage.getItem('focus'))) updateUnreadCount(e.data.chatroomID);
                if (document.visibilityState === 'visible') displayToast(`New message arrived from ${chatroomNameMap.get(e.data.chatroomID)}.`);
            }
            break;
        case 'Invite':
            if (e.data.message === null) {
                chatroomNameMap.set(e.data.chatroomID, isMine() ? e.data.receiver : e.data.sender);
                unreadCount.set(e.data.chatroomID, 0);
                addChatRoom(e.data.chatroomID);
                displayToast( isMine() ? `New chatroom with ${e.data.receiver} is created.` : `${e.data.sender} invite you to new chatroom.` );
            } else displayAlert('warning', e.data.message);
            break;
        case 'Close':
            setEnablity(false, '#members', '#chatrooms', '#message', '#send');
            displayAlert('danger', `Server terminated. See you next time, ${localStorage.getItem('nickname')}!`);            
            break;
        default:
            if (e.data.chatroomID !== 0) break;
            switch (e.data.event) {    
                case 'Initial':
                    setEnablity(true, '#members', '#chatrooms', '#message', '#send');
                    send('Welcome', e.data.receiver);
                    break;
                case 'Welcome':
                    displayAlert('success', isMine() ? `Welcome ${e.data.message ? ' back' : ''} to Group Chat Server, ${localStorage.getItem('nickname')}!` : `${e.data.sender} joins the Chat Server. ${e.data.message ? ('Say Hello to ' + e.data.sender) : ''}`);
                    break;
                case 'Goodbye':
                    displayAlert('warning', `${e.data.sender} left the Chat Server.`);
                    break;
                case 'Members':
                    for (const member of e.data.message) {
                        if (member === localStorage.getItem('nickname')) continue;
                        addMember(member);
                    }
                    memberProgress.style.display = 'none';
                    break;
                case 'Whisper':
                    if (isMine()) {
                        displayToast(`Succefully whispered to ${e.data.receiver}.`);
                        displayAlert('secondary', `Whispers to ${e.data.receiver}: ${e.data.message}`);
                    } else {
                        displayToast(`${e.data.sender} whisper to you.`);
                        displayAlert('secondary', `${e.data.sender} whispers to you: ${e.data.message}`);
                    }
                    break;
            }
    }
});

// initialize
localStorage.setItem('focus', 0);
displayModal(
    'Welcome to Group Chat Server',
    `<input id="nickname" class="form-control" placeholder="Please type your nickname here and click 'Confirm'.">`,
    () => {
        localStorage.setItem('nickname', document.querySelector('#nickname').value);
        worker = new Worker('./js/worker.js');
        worker.addEventListener('message', (e) => {
            switch (e.data.event) {
                case 'Open':
                    send('Initial', []);
                    break;
            }
        })
    }, true
);