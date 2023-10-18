export default class ChatroomInfo {

    #members = new Set();
    #messages = [];

    constructor(...members) {
        for (const member of members) this.#members.add(member);
    }

    getMembers() {
        return this.#members;
    }

    getMessages() {
        return this.#messages;
    }

    addMember(member) {
        this.#members.add(member);
    }

    removeMember(member) {
        return this.#members.delete(member);
    }

    storeMessage(payload) {
        this.#messages.push(payload);
    }
}