export default class Payload {
    constructor(event, sender, receiver, message, chatroomID) {
        this.event = event;
        this.sender = sender;
        this.receiver = receiver;
        this.message = message;
        this.chatroomID = chatroomID;
    }
}