export default class Form {
    constructor(event, receiver, message, chatroomID) {
        this.event = event;
        this.sender = localStorage.getItem('nickname');
        this.receiver = receiver;
        this.message = message;
        this.chatroomID = chatroomID;
    }
}