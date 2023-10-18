export default class UserRoomInfo {
    constructor(chatroomName, unreadCount = 0) {
        this.chatroomName = chatroomName;
        this.unreadCount = unreadCount;
    }
}