const manager = new EventTarget();

// events
//
// 1. connect
// - when client type nickname and click 'Confirm' button.
// detail: {name[string]}
//
// 2. open
// - when websocket established between client and server.
// detail: {name[string]}
//
// 3. close
// - when client disconnects from server, or vice versa.
// detail: {name[string]}
//
// 4. groupchat
// - when someone send message to group chat server.
// detail: {paylord[JSON], name[string]}
//
// 5. chatroom
// - when someone send message in chat room.
// detail: {paylord[JSON], name[string]}
//
// 6. action
// - when action(execpt message) is fired.
// detail: {paylord[JSON], name[string]}
//
// 7. send
// - when client send message or actions.
// detail: {type[string], sender[string], receiver[string], message[string], chatRoomId[number]}

export default manager;