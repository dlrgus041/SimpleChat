let main = true;
let ws = null;

const chatRoomNameMap = new Map(); // <Number, String>
chatRoomNameMap.set(0, 'Group Chat');

function emit(port, event, arg = null) {
    console.log(`emit ${event} to ${port}`);
    port.postMessage({event: event, arg: arg});
}

addEventListener('connect', (event) => {
    const port = event.ports[0];

    if (main) {
        main = false;

        ws = new WebSocket('ws://localhost:8080');
        
        ws.addEventListener('open', () => {
            emit(port, 'open');
        });

        ws.addEventListener('close', () => {
            emit(port, 'close');
        });
    }
    
    ws.addEventListener('message', (event) => {
        const payload = JSON.parse(event.data);
        if (payload.type === 'Initial') {
            for (const msg of payload.message) {emit(event.origin, 'previous', msg);}
            emit(port, 'action', payload);
        } else emit(port, (payload.type !== 'Message' ? 'action' : 'chat'), payload);
    });

    port.onmessage = (e) => {
        ws.send(JSON.stringify(e.data));
    };
});