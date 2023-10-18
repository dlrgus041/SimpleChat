export default class Payload {
    constructor(event, receiver = null, message = null, chatroomID = 0) {
        this.event = event;
        this.sender = localStorage.getItem('nickname');
        this.receiver = receiver;
        this.message = message;
        this.chatroomID = chatroomID;
    }
}