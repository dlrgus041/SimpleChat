var ws = null;
var nickname = null;
const chatArea = document.querySelector('#chatArea');

function findNode(id) {
    return document.getElementById(id);
}

function addBtnListener(id, listener) {
    return findNode(id).addEventListener('click', listener);
}

function setEnablity(enablity, ...ids) {
    for (const id in ids) {
        findNode(`${id}`).disabled = !enablity;
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

addBtnListener('#connect', () => {
    try {
        ws = new WebSocket('ws://localhost:8080/server');
    } catch (e) {
        alert('Error occured whlie connect Server. \n\n' + e);
    }
});

addBtnListener('#close', () => {
    try {
        ws.close();
        ws = null;
        nickname = null;
        findNode('#nickname').value = '';
        setEnablity(true, '#connect', '#nickname', '#connect');
        setEnablity(false, '#trigger', '#message', '#send');
        chatAlert('warning', 'Connection Closed. You can Re-connect to Server.');
    } catch (e) {
        alert('Error occured whlie close connection. \n\n' + e);
    }
})

ws.addEventListener('open', (event) => {
    nickname = findNode('#nickname').value;
    setEnablity(false, '#nickname', '#connect');
    setEnablity(true, '#trigger', '#message', '#send');
    chatAlert('success', `Welcomme to Chat Server, ${nickname}!`);
});

ws.addEventListener('close', (event) => {
    setEnablity(false, '#trigger', '#message', '#send');
    chatAlert('danger', `Server Terminated. See you next time, ${nickname}!`);
});