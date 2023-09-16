import functions from "./functions.js";

// variables
var ws = null;
var nickname = '';
var isClientConnected = false;
var waitInviteReply = false;

// listeners
document.querySelector('#connect').addEventListener('click', () => {

    if (document.querySelector('#nickname').value === '') {
        functions.displayAlert('info', 'Please enter your nickname.');
        return;
    }

    try {
        ws = new WebSocket('ws://localhost:8080');

        ws.addEventListener('open', (event) => {
            isClientConnected = true;
            nickname = document.querySelector('#nickname').value;
            functions.setEnablity(false, '#nickname', '#connect');
            functions.setEnablity(true, '#members', '#chatRooms', '#message', '#send');
            functions.displayAlert('success', `Welcomme to Group Chat Server, ${nickname}! You can close connection to click 'Close' button.`);
            functions.sendMessage(ws, 'Welcome', nickname);
        });

        ws.addEventListener('close', (event) => {
            if (!isClientConnected) return;
            functions.setEnablity(false, '#members', '#chatRooms', '#message', '#send');
            functions.displayAlert('danger', `Server terminated. See you next time, ${nickname}!`);
        });

        ws.addEventListener('message', (event) => {

            const payload = JSON.parse(event.data);
            switch (payload['type']) {
                case 'Welcome':
                    functions.displayAlert('success', `${payload['sender']} joins the Chat Server. Say Hello to ${payload['sender']}!`);
                    break;
                case 'Goodbye':
                    functions.displayAlert('warning', `${payload['sender']} left the Chat Server.`);
                    break;
                case 'Message':
                    functions.displayMessage(payload);
                    break;
                case 'Members':
                    for (const members of payload['message']) {
                        if (members['member'] === nickname) continue;
                        functions.addMember(members['member']);
                    }
                    document.querySelector('#progress').style.display = 'none';
                    break;
                case 'Whisper':
                    functions.displayAlert('secondary', `${payload['sender']} whispers to you: ${payload['message']} <a id="whisperReply">reply</a>`);
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
    functions.sendMessage(ws, 'Message', nickname, null, document.querySelector('#message').value);
    document.querySelector('#message').value = '';
});

document.querySelector('#members').addEventListener('click', () => {
    document.querySelector('#progress').style.display = 'block';
    functions.sendMessage(ws, 'Members', nickname);
});

// initialize
functions.displayModal();
functions.displayAlert('info', 'To join in group chat server, please type your nickname above and click "Connect" button.');
// functions.addMember('John Doe');
// functions.addMember('Jane Doe');
functions.addChatRoom('Chat Room 1');
functions.addChatRoom('Chat Room 2');