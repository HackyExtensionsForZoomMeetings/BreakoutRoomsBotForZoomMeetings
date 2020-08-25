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
    chatboxElement.dispatchEvent(new Event('input', { bubbles: true}));

    const oEvent = document.createEvent('KeyboardEvent');
    // Chromium Hack
    Object.defineProperty(oEvent, 'keyCode', {
                get : function() {
                    return this.keyCodeVal;
                }
    });
    Object.defineProperty(oEvent, 'which', {
                get : function() {
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
    var clickMoveToButtonInterval = setInterval(function() {
        if (document.querySelector('.bo-room-item-attendee__tools')) {
            document.querySelector('.bo-room-item-attendee__tools > button').click()
            var selectRoomClickInterval = setInterval(function() {
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
    rxjs.operators.map(chatState=>{
        return {
            sender: chatState.slice(-1)[0].sender,
            message: chatState.slice(-1)[0].chatMsgs.slice(-1)[0],
        }
    }),
    rxjs.operators.publish(),
    rxjs.operators.refCount(),
)

// SUBSCRIPTIONS

var versionReplySubscription = userMessageMapObservable.subscribe(
    ({sender, message}) => {
        if (message == "!version") {
            chatboxSend(`BreakoutRoomBot ${BREAKOUT_ROOM_BOT_VERSION} | github.com/nelsonjchen/HackyZoomBreakoutBot`)
        }
    }
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

var breakoutRoomListReplySubscription = breakoutRoomListReplyObservable.subscribe(
    (message) => chatboxSend(message)
)