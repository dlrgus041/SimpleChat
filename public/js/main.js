const workerWatchdog = new EventTarget();
let worker = null;

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

const progressbar = document.querySelector('#progress');

// functions
function sendMessage(type, sender = null, receiver = null, message = null, chatRoomId = 0) {
    worker?.port.postMessage({
        type: type,
        sender: sender,
        receiver: receiver,
        message: message,
        chatRoomId: chatRoomId
    });
}

function displayAlert(type, message) {
    const node = alertForm.cloneNode(true);
    node.style.display = 'block';
    node.classList.add(`alert-${type}`);
    node.innerHTML = message;
    groupChatArea.appendChild(node);
};

function displayMessage(data) {
    
    const isMine = (data.payload.sender === data.name);
    const node = groupChatForm.cloneNode(true);
    
    node.style.display = 'block';
    node.style.textAlign = isMine ? 'right' : 'left';

    node.children[0].classList.add(isMine ? 'mine' : 'other');
    node.children[0].innerHTML = (isMine? '' : (data.payload.sender + ': ')) + data.payload.message;

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
            () => {
                sendMessage('Invite', memberName);
            }
        );
    });

    node.children[0].children[1].children[1].addEventListener('click', () => {
        displayModal(
            `Whisper to ${memberName}`,
            `<input id="whisperMessage" class="form-control ms-2 me-2" placeholder="Type whisper message here">`,
            () => {
                const message = document.querySelector('#whisperMessage').value;
                sendMessage('Whisper', memberName, message);
            }
        );
    });

    memberArea.appendChild(node);
}

function clearMember() {
    memberArea.textContent = '';
}

function addChatRoom(chatRoomId) {

    const node = chatRoomForm.cloneNode(true);
    node.style.display = 'block';
    chatRoomMap.set(chatRoomId, `ChatRoom ${chatRoomId}`);

    node.addEventListener('click', () => {
        setFocused(chatRoomId);
        enterChatRoom('/chatroom', {
            id: chatRoomId,
            name: chatRoomMap.get(chatRoomId) 
        });
    });

    node.children[0].children[0].children[0].innerHTML = chatRoomMap.get(chatRoomId);
    node.children[0].children[1].children[0].addEventListener('click', () => {
        sendMessage('Members', null, null, chatRoomId);
    });
    node.children[0].children[1].children[1].addEventListener('click', () => {
        displayModal(
            'Warning',
            `All messages in ${chatRoomMap.get(chatRoomId)} will be deleted. Are you sure?`,
            () => {
                sendMessage('Leave', null, null, chatRoomId);
            }
        )
    });

    chatRoomArea.appendChild(node);
}

function removeChatRoom(chatRoomId) {
    chatRoomMap.get(chatRoomId).remove();
    chatRoomMap.delete(chatRoomId);
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
    sendMessage('Message', null, document.querySelector('#message').value);
    document.querySelector('#message').value = '';
});

document.querySelector('#members').addEventListener('click', () => {
    clearMember();
    memberArea.appendChild(progressbar);
    progressbar.style.display = 'block';
    sendMessage('Members');
});

// document.addEventListener("visibilitychange", () => {
//     if (document.visibilityState == 'visible') {
//         focusedChatRoom = 0;
//     }
// });

// worker using watchdog
workerWatchdog.addEventListener('worker', () => {
    worker.port.onmessage = (e) => {

        switch (e.data.event) {
            case 'open':
                sendMessage('Initial');
                break;
            case 'close':
                setEnablity(false, '#members', '#chatRooms', '#message', '#send');
                displayAlert('danger', `Server terminated. See you next time, ${sessionStorage.getItem('nickname')}!`);
                sessionStorage.removeItem('nickname'); 
                break;
            case 'previous':
                if (e.data.arg.chatRoomId == 0) displayMessage(e.data.arg);
                else if (document.visibilityState === 'visible') displayToast(`New message arrived from ${chatRoomMap.get(e0.data.arg.chatRoomId)}.`);    
                break;
            case 'action':
                switch (e.data.arg.type) {
                    case 'Initial':
                        setEnablity(true, '#members', '#chatRooms', '#message', '#send');
                        sendMessage('Welcome');
                        break;
                    case 'Welcome':
                        displayAlert(
                            'success', 
                            e.data.arg.sender === sessionStorage.getItem('nickname')
                            ? `Welcomme to Group Chat Server, ${e.data.arg.sender}!`
                            : `${e.data.arg.sender} joins the Chat Server. Say Hello to ${e.data.arg.sender}!`
                        );
                        break;
                    case 'Goodbye':
                        displayAlert('warning', `${e.data.arg.sender} left the Chat Server.`);
                        break;
                    case 'Members':
                        for (const members of e.data.arg.message) {
                            if (members.member === sessionStorage.getItem('nickname')) continue;
                            addMember(members.member);
                        }
                        progressbar.style.display = 'none';
                        break;
                    case 'Whisper':
                        if (e.data.arg.sender === sessionStorage.getItem('nickname')) {
                            displayToast(`Succefully whispered to ${e.data.arg.sender}.`);
                            displayAlert('secondary', `Whispers to ${e.data.arg.sender}: ${e.data.arg.message}`);
                        } else {
                            displayToast(`${e.data.arg.sender} whisper to you.`);
                            displayAlert('secondary', `${e.data.arg.sender} whispers to you: ${e.data.arg.message}`);
                        }
                        break;
                    case 'Invite':
                        addChatRoom(e.data.arg.chatRoomId);
                        displayToast(
                            e.data.arg.sender === sessionStorage.getItem('nickname')
                            ? `New chatroom with ${e.data.arg.receiver} is created.`
                            : `${e.data.arg.receiver} invite you to new chatroom.`,
                        );
                        break;
                    // case 'Create':
                    //     addChatRoom(e.data.arg.chatRoomId, e.data.arg.sender);
                    //     break;
                }
        }
    }
})

// initialize
displayModal(
    'Welcome to Group Chat Server',
    `<input id="nickname" class="form-control" placeholder="Please type your nickname here and click 'Confirm'.">`,
    () => {
        sessionStorage.setItem('nickname', document.querySelector('#nickname').value);
        worker = new SharedWorker('./js/background.js');
        workerWatchdog.dispatchEvent(new Event('worker'));
    }, true
);