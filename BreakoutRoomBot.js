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

var internalStore = document.getElementById('root')._reactRootContainer._internalRoot.current.child.pendingProps.store;

var storeObservable = getStoreObservable(internalStore).pipe(
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
    rxjs.operators.map((_) => `🤖💔 BreakoutRoomBot ${BREAKOUT_ROOM_BOT_VERSION}\ngithub.com/nelsonjchen/HackyZoomBreakoutBot`)
)

var breakoutRoomListReplyObservable = userMessageMapObservable.pipe(
    rxjs.operators.filter(({ _, message }) => message == "!ls"),
    rxjs.operators.withLatestFrom(
        storeObservable, (_, state) =>
        "📜 Breakout Room List\n" +
        "Chat \"!ls\" to see this list\n" +
        state.breakoutRoom.roomList.map(
            (room, index) => `Chat "!mv ${index + 1}" into Group Chat to be assigned to Breakout Room "${room.name}"`
        ).join('\n') +
        "\n" +
        "End of List"
    ),
)

var moveRequestDelayer = rxjs.interval(300);

var moveRequestMessages = userMessageMapObservable.pipe(
    rxjs.operators.filter(({ _, message }) => message.startsWith("!mv ")),
)

var moveRequestObservable = rxjs.zip(moveRequestMessages, moveRequestDelayer).pipe(
    rxjs.operators.map(([s, _d]) => s),
    rxjs.operators.map(({ sender, message }) => {
        return {
            sender: sender,
            roomIdStr: message.substring(4),
        }
    }),
    rxjs.operators.withLatestFrom(
        storeObservable,
        ({ sender, roomIdStr }, storeState) => {
            const genericHelpMessage = "❓ Chat \"!ls\" to list rooms and other commands."

            if (!/^\d+$/.test(roomIdStr)) {
                return `⚠️ @${sender} Room ID must be an integer.\n` + genericHelpMessage
            }
            var roomId = parseInt(roomIdStr, 10);

            var guidSenderMap = new Map(
                storeState.attendeesList.attendeesList.map(
                    attendee => [attendee.userGUID, attendee.displayName]
                )
            );

            if (roomId <= 0) {
                return `⚠️ @${sender} Room ID "${roomIdStr}" out of range!\n` + genericHelpMessage
            }

            if (roomId > storeState.breakoutRoom.roomList.length) {
                return `⚠️ @${sender} Room ID "${roomIdStr}" out of range!\n` + genericHelpMessage
            }

            var room = storeState.breakoutRoom.roomList[roomId - 1];
            var roomAttendeesByName = room.attendeeIdList.map(attendeeId => guidSenderMap.get(attendeeId));

            if (roomAttendeesByName.includes(sender)) {
                return `⚠️ Requester "${sender}" already in "${room.name}"\n` + genericHelpMessage
            }

            if (Array.from(guidSenderMap.values()).filter(x => x == sender).length > 1) {
                return `⚠️ "${sender}" must have a unique name in the meeting for this to operate. "${sender}"s, please rename to unique names.\n` + genericHelpMessage
            }

            assignedUnjoinedUserToBreakoutRoom(sender, room.name);

            return `🎯 Assigning "${sender}" to "${room.name}"\n` + genericHelpMessage
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

// Open the chat pane if it isn't already open.
var chatPaneButton = document.querySelector('[aria-label^="open the chat pane"]')
if (chatPaneButton) {
    chatPaneButton.click();
}