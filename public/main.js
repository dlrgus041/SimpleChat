var ws = null;

var nickname = null;

document.querySelector('#connect').addEventListener('click', () => {
    ws = new WebSocket('ws://localhost:8080/server');

    ws.addEventListener('error', (event) => {
        console.log(event.data);
    });

    ws.addEventListener('open', (event) => {
        console.log(event.data);
        console.log('Connected to server');
        nickname = document.querySelector('#nickname').value;
        document.querySelector('#connect').disabled = true
    });
});