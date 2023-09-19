document.querySelector('#connect').addEventListener('click', () => {

    if (document.querySelector('#nickname').value === '') {
        displayAlert('info', 'Please enter your nickname.');
        return;
    }

    try {
        variables.ws = new WebSocket('ws://localhost:8080');

        variables.ws.addEventListener('open', (event) => {
            variables.isClientConnected = true;
            variables.nickname = document.querySelector('#nickname').value;
            setEnablity(false, '#nickname', '#connect');
            setEnablity(true, '#members', '#chatRooms', '#message', '#send');
            displayAlert('success', `Welcomme to Group Chat Server, ${variables.nickname}! You can close connection to click 'Close' button.`);
            sendMessage('Welcome');
        });

        variables.ws.addEventListener('close', (event) => {
            if (!variables.isClientConnected) return;
            setEnablity(false, '#members', '#chatRooms', '#message', '#send');
            displayAlert('danger', `Server terminated. See you next time, ${nickname}!`);
        });

        variables.ws.addEventListener('message', (event) => {

            const payload = JSON.parse(event.data);
            switch (payload['type']) {
                case 'Welcome':
                    displayAlert('success', `${payload['sender']} joins the Chat Server. Say Hello to ${payload['sender']}!`);
                    break;
                case 'Goodbye':
                    displayAlert('warning', `${payload['sender']} left the Chat Server.`);
                    break;
                case 'Message':
                    displayMessage(payload);
                    break;
                case 'Members':
                    for (const members of payload['message']) {
                        if (members['member'] === variables.nickname) continue;
                        addMember(members['member']);
                    }
                    document.querySelector('#progress').style.display = 'none';
                    break;
                case 'Whisper':
                    displayAlert('secondary', `${payload['sender']} whispers to you: ${payload['message']}`);
                    break;
                case 'Invite':
                    displayToast(
                        `${payload['sender']} invite you to chat room.`,
                        () => {
                            displayModal(
                                `${payload['sender']} invite you to chat room.`,
                                `Do you want to chat with ${payload['sender']} in chatroom?`,
                                () => {
                                    sendMessage('Accept', payload['sender']);
                                }
                            )
                        }
                    );
                    break;
                case 'Create':
                    addChatRoom(
                        payload['chatRoomId'],
                        variables.nickname === payload['sender'] ? payload['receiver'] : payload['sender']
                    );
            }
        });
    } catch (e) {
        alert('Error occured whlie connect Server. \n\n' + e);
    }
});