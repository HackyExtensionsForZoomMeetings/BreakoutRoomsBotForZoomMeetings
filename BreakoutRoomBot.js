BREAKOUT_ROOM_BOT_VERSION = "2020.08.1"

// HELPER FUNCTIONS

function getStoreObservable(store) {
    return new rxjs.Observable(function (observer) {
        const unsubscribe = store.subscribe(function () {
            observer.next(store.getState());
        });
    });
}

function chatboxSend(msg) {
    const chatboxElement = document.getElementsByClassName('chat-box__chat-textarea')[0];
    const nativeTextAreaValueSetter = Object.getOwnPropertyDescriptor(window.HTMLTextAreaElement.prototype, "value").set;
    nativeTextAreaValueSetter.call(chatboxElement, msg);
    chatboxElement.dispatchEvent(new Event('input', { bubbles: true }));

    const oEvent = document.createEvent('KeyboardEvent');
    // Chromium Hack
    Object.defineProperty(oEvent, 'keyCode', {
        get: function () {
            return this.keyCodeVal;
        }
    });
    Object.defineProperty(oEvent, 'which', {
        get: function () {
            return this.keyCodeVal;
        }
    });

    const k = 13;

    oEvent.initKeyboardEvent("keydown", true, true, document.defaultView, k, k, "", "", false, "");

    oEvent.keyCodeVal = k;

    chatboxElement.dispatchEvent(oEvent);
}

function reactMouseOver(el) {
    var oEvent = document.createEvent('MouseEvent');
    oEvent.initMouseEvent("mouseover", true, true, window, 0, 0, 0, 0, 0, false, false, false, false, 0, null);
    el.dispatchEvent(oEvent);
}

function assignedUnjoinedUserToBreakoutRoom(senderName, roomName) {
    var attendeeEl = document.querySelector(`.bo-room-item-attendee[aria-label|="${senderName},Not Joined"]`);
    reactMouseOver(attendeeEl);
    var clickMoveToButtonInterval = setInterval(function () {
        if (document.querySelector('.bo-room-item-attendee__tools')) {
            document.querySelector('.bo-room-item-attendee__tools > button').click()
            var selectRoomClickInterval = setInterval(function () {
                if (document.querySelector(`.zmu-data-selector-item[aria-label^="${roomName},"]`)) {
                    document.querySelector(`.zmu-data-selector-item[aria-label^="${roomName},"]`).click()
                    clearInterval(selectRoomClickInterval);
                }
            }, 100);
            clearInterval(clickMoveToButtonInterval);
        }
    }, 100);
}

// OBSERVABLES

var storeObservable = getStoreObservable($r.props.store).pipe(
    rxjs.operators.publish(),
    rxjs.operators.refCount(),
)

var chatObservable = storeObservable.pipe(
    rxjs.operators.map(s => s.chat.meetingChat),
    rxjs.operators.distinctUntilChanged(),
    rxjs.operators.skip(1),
    rxjs.operators.publish(),
    rxjs.operators.refCount(),
)


var userMessageMapObservable = chatObservable.pipe(
    rxjs.operators.map(chatState => {
        return {
            sender: chatState.slice(-1)[0].sender,
            message: chatState.slice(-1)[0].chatMsgs.slice(-1)[0],
        }
    }),
    rxjs.operators.publish(),
    rxjs.operators.refCount(),
)

var versionReplyObservable = userMessageMapObservable.pipe(
    rxjs.operators.filter(({ _, message }) => message == "!version"),
    rxjs.operators.map((_) => `BreakoutRoomBot ${BREAKOUT_ROOM_BOT_VERSION} | github.com/nelsonjchen/HackyZoomBreakoutBot`)
)

var breakoutRoomListReplyObservable = userMessageMapObservable.pipe(
    rxjs.operators.filter(({ _, message }) => message == "!ls"),
    rxjs.operators.withLatestFrom(
        storeObservable, (_, state) =>
        "Breakout Room List\n" +
        "Chat \"!ls\" to see this list\n" +
        state.breakoutRoom.roomList.map(
            (room, index) => `Chat "!mv ${index}" to be assigned to ${room.name}`
        ).join('\n')
    ),
)

var moveRequestObservable = userMessageMapObservable.pipe(
    rxjs.operators.filter(({ _, message }) => message.startsWith("!mv ")),
    rxjs.operators.map( ({ sender, message }) =>
    {
        return {
            sender: sender,
            roomIdStr: message.substring(4),
        }
    }),
    rxjs.operators.withLatestFrom(
        storeObservable,
        ({ sender, roomIdStr}, storeState) => {
            if (!/^\d+$/.test(roomIdStr)) {
                return "Room ID must be an integer"
            }
            var roomId = parseInt(roomIdStr, 10);

            var guidSenderMap = new Map(
                storeState.attendeesList.attendeesList.map(
                    attendee => [ attendee.userGUID, attendee.displayName]
                )
            );

            if (roomId >= storeState.breakoutRoom.roomList.length) {
                return "Room ID out of range"
            }

            var room = storeState.breakoutRoom.roomList[roomId];
            var roomAttendeesByName = room.attendeeIdList.map(attendeeId => guidSenderMap.get(attendeeId));

            if (sender in roomAttendeesByName){
                return "Requester already in room"
            }

            assignedUnjoinedUserToBreakoutRoom(sender, room.name);

            return `Assigning ""${sender}" to "${room.name}"`
        }
    ),
)

// SUBSCRIPTIONS

var versionReplySubscription = versionReplyObservable.subscribe(
    (message) => chatboxSend(message)
)


var breakoutRoomListReplySubscription = breakoutRoomListReplyObservable.subscribe(
    (message) => chatboxSend(message)
)

var moveRequestSubscription = moveRequestObservable.subscribe(
    (message) => chatboxSend(message)
)