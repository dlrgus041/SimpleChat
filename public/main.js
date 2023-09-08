var ws = null;
var nickname = null;
var isClientConnected = false;
const chatArea = document.querySelector('#chatArea');

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

function displayMessage(message, isMine) {

    const inner = document.createElement('div');
    inner.className = 'inner ' + (isMine ? 'mine' : 'other');
    inner.style.display = 'inline';
    inner.innerHTML = message;

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
            setEnablity(true, '#trigger', '#message', '#send');
            chatAlert('success', `Welcomme to Chat Server, ${nickname}!`);
            ws.send('Welcome:' + nickname);
        });

        ws.addEventListener('close', (event) => {
            if (!isClientConnected) return;
            setEnablity(false, '#trigger', '#message', '#send');
            chatAlert('danger', `Server terminated. See you next time, ${nickname}!`);
        });

        ws.addEventListener('message', (event) => {

            const arr = event.data.split(':');
            switch (arr[0]) {
                case 'Welcome':
                    chatAlert('success', `${arr[1]} joins the Chat Server. Say Hello to ${arr[1]}!`);
                    break;
                case 'Goodbye':
                    chatAlert('warning', `${arr[1]} leaves the Chat Server.`);
                    break;
                default:
                    displayMessage(event.data, arr[0] === nickname);
            }
        });
    } catch (e) {
        alert('Error occured whlie connect Server. \n\n' + e);
    }
});

document.querySelector('#close').addEventListener('click', () => {
    try {
        isClientConnected = false;
        ws.close();
        ws = null;
        nickname = null;
        document.querySelector('#nickname').value = '';
        setEnablity(true, '#connect', '#nickname', '#connect');
        setEnablity(false, '#trigger', '#message', '#send');
        chatAlert('warning', 'Connection closed. You can re-connect to server.');
    } catch (e) {
        alert('Error occured whlie close connection. \n\n' + e);
    }
});

document.querySelector('#send').addEventListener('click', () => {
    ws.send(nickname + ':' + document.querySelector('#message').value);
    document.querySelector('#message').value = '';
});