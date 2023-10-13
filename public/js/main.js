import Form from './Form.js';

const bc = new BroadcastChannel('channel');
const chatRoomNameMap = new Map(); // <Number, String>

// HTML elements
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

const memberProgress = document.querySelector('#progress');

// functions
function send(event, receiver = null, message = null) {
    bc.postMessage(new Form(event, receiver, message, 0));
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

    const node = chatRoomForm.cloneNode(true);
    node.style.display = 'block';
    chatRoomNameMap.set(chatroomID, `ChatRoom ${chatroomID}`);

    node.addEventListener('click', () => {
        localStorage.setItem('focus', chatroomID);
        enterChatRoom('/chatroom', {id: chatroomID});
    });

    node.children[0].children[0].children[0].innerHTML = chatRoomNameMap.get(chatroomID);
    node.children[0].children[1].children[0].addEventListener('click', () => {
        send('Members', null, null, chatroomID);
    });

    node.children[0].children[1].children[1].addEventListener('click', () => {
        displayModal(
            'Warning',
            `All messages in ${chatRoomNameMap.get(chatroomID)} will be deleted. Are you sure?`,
            () => { send('Leave', null, null, chatroomID); }
        )
    });

    chatRoomArea.appendChild(node);
}

function removeChatRoom(chatroomID) {
    chatRoomMap.get(chatroomID).remove();
    chatRoomMap.delete(chatroomID);
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

// BroadcastChannel
bc.addEventListener('message', (e) => {
    switch (e.data.event) {
        case 'Chat':
            if (e.data.chatroomID === 0) displayMessage(e.data);
            else if (document.visibilityState === 'visible') displayToast(`New message arrived from ${chatRoomNameMap.get(e.data.chatroomID)}.`);
            break;
        case 'Invite':
            if (e.data.message === null) {
                addChatRoom(e.data.chatroomID);
                displayToast(
                    e.data.sender === localStorage.getItem('nickname')
                    ? `New chatroom with ${e.data.receiver} is created.`
                    : `${e.data.receiver} invite you to new chatroom.`,
                );
            } else displayAlert('warning', e.data.message);
            break;
        default:
            if (e.data.chatroomID !== 0) break;
            switch (e.data.event) {    
                case 'Initial':
                    setEnablity(true, '#members', '#chatRooms', '#message', '#send');
                    send('Welcome');
                    break;
                case 'Welcome':
                    displayAlert(
                        'success', 
                        e.data.sender === localStorage.getItem('nickname')
                        ? `Welcomme to Group Chat Server, ${localStorage.getItem('nickname')}!`
                        : `${e.data.sender} joins the Chat Server. Say Hello to ${e.data.sender}!`
                    );
                    break;
                case 'Goodbye':
                    displayAlert('warning', `${e.data.sender} left the Chat Server.`);
                    break;
                case 'Members':
                    for (const members of e.data.message) {
                        if (members.member === localStorage.getItem('nickname')) continue;
                        addMember(members.member);
                    }
                    memberProgress.style.display = 'none';
                    break;
                case 'Whisper':
                    if (e.data.sender === localStorage.getItem('nickname')) {
                        displayToast(`Succefully whispered to ${e.data.sender}.`);
                        displayAlert('secondary', `Whispers to ${e.data.sender}: ${e.data.message}`);
                    } else {
                        displayToast(`${e.data.sender} whisper to you.`);
                        displayAlert('secondary', `${e.data.sender} whispers to you: ${e.data.message}`);
                    }
                    break;
            }
    }
});

// initialize
chatRoomNameMap.set(0, 'Group Chat');
localStorage.setItem('focus', 0);
displayModal(
    'Welcome to Group Chat Server',
    `<input id="nickname" class="form-control" placeholder="Please type your nickname here and click 'Confirm'.">`,
    () => {
        localStorage.setItem('nickname', document.querySelector('#nickname').value);
        const worker = new Worker('./js/worker.js');
        worker.addEventListener('message', (e) => {
            switch (e.data.event) {
                case 'Open':
                    send('Initial');
                    break;
                case 'Close':
                    setEnablity(false, '#members', '#chatRooms', '#message', '#send');
                    displayAlert('danger', `Server terminated. See you next time, ${localStorage.getItem('nickname')}!`);            
                    break;
            }
        })
    }, true
);