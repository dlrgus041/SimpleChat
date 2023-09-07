import Websocket from 'ws';
const ws = null;

const nickname = null;

function connect() {

    ws = new Websocket('ws://localhost:3001');

    ws.on('error', (err) => {
        console.log(err);
    });

    ws.on('open', () => {
        console.log('Connected to server');
        nickname = document.querySelector('#nickname').value;
        document.querySelector('#connect').disabled = true
    });
}