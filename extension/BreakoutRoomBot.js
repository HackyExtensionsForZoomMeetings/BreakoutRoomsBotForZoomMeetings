BREAKOUT_ROOM_BOT_VERSION = "2020.09.6"

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

// This function uses GUI clicking stuff
async function assignedUnjoinedUserToBreakoutRoom(senderName, roomName) {
    console.log(`Assigning ${senderName} to ${roomName}`)
    var attendeeEl = document.querySelector(`.bo-room-item-attendee[aria-label|="${senderName},Not Joined"]`);
    if (attendeeEl == null) {
        var attendeeEl = document.querySelector(`.bo-room-item-attendee[aria-label|="${senderName}"]`);
    }
    reactMouseOver(attendeeEl);
    console.log("Waiting for moveToButton")
    var moveToButtonEl = await waitForElm('.bo-room-item-attendee__tools > button');
    moveToButtonEl.click();
    console.log("Clicked moveToButton")
    console.log("Waiting for selectRoomEl")
    var selectRoomEl = await waitForElm(`.zmu-data-selector-item[aria-label^="${roomName},"]`);
    selectRoomEl.click();
    console.log("Waiting for selectRoomEl")
    console.log("Clicked selectRoomEl")
}

// This function uses websockets
function assignUserIdToBreakoutRoomUuid(senderUserId, roomUuid) {
    console.log(`Assigning ${senderUserId} to ${roomUuid}`)
    var storeState = internalStore.getState();
    var sender = storeState.attendeesList.attendeesList.find(({ userId }) => userId == senderUserId)
    var senderInBreakoutRoom = storeState.breakoutRoom.roomList.flatMap(room => room.attendeeIdList).includes(sender.userGUID)
    if (senderInBreakoutRoom) {
        window.commandSocket.send(JSON.stringify(
            { "evt": 4181, "body": { "targetBID": roomUuid, "targetID": senderUserId }, "seq": 0 }
        ))
    } else {
        window.commandSocket.send(JSON.stringify(
            { "evt": 4179, "body": { "targetBID": roomUuid, "targetID": senderUserId }, "seq": 0 }
        ))
    }
}

// https://stackoverflow.com/a/61511955/286021
function waitForElm(selector) {
    return new Promise(resolve => {
        if (document.querySelector(selector)) {
            return resolve(document.querySelector(selector));
        }

        const observer = new MutationObserver(mutations => {
            if (document.querySelector(selector)) {
                resolve(document.querySelector(selector));
                observer.disconnect();
            }
        });

        observer.observe(document.body, {
            childList: true,
            subtree: true
        });
    });
}

// OBSERVABLES

var internalStore = document.getElementById('root')._reactRootContainer._internalRoot.current.child.pendingProps.store;

var store$ = getStoreObservable(internalStore).pipe(
    rxjs.operators.publish(),
    rxjs.operators.refCount(),
)

var chat$ = store$.pipe(
    rxjs.operators.map(s => s.chat.meetingChat),
    rxjs.operators.distinctUntilChanged(),
    rxjs.operators.skip(1),
    rxjs.operators.publish(),
    rxjs.operators.refCount(),
)

// Transforms the user to map stuff to be a user -> name pair like IRC/etc
var userMessageMap$ = chat$.pipe(
    rxjs.operators.map(chatState => {
        return {
            sender: chatState.slice(-1)[0].sender,
            senderUserId: chatState.slice(-1)[0].senderId,
            message: chatState.slice(-1)[0].chatMsgs.slice(-1)[0],
        }
    }),
    rxjs.operators.publish(),
    rxjs.operators.refCount(),
)

var versionCommand$ = userMessageMap$.pipe(
    rxjs.operators.filter(({ message }) => message == "!version"),
)

var versionReply$ = versionCommand$.pipe(
    rxjs.operators.map((_) => `🤖💔 BreakoutRoomBot ${BREAKOUT_ROOM_BOT_VERSION}\ngithub.com/nelsonjchen/HackyZoomBreakoutBot`)
)

var breakoutRoomListCommand$ = userMessageMap$.pipe(
    rxjs.operators.filter(({ message }) => message == "!ls"),
)

var breakoutRoomListReply$ = breakoutRoomListCommand$.pipe(
    rxjs.operators.withLatestFrom(
        store$,
        (_, storeState) =>
            "📜 Breakout Room List\n" +
            "Chat \"!ls\" to see this list\n" +
            storeState.breakoutRoom.roomList.map(
                (room, index) => `❇️ Chat "!mv ${index + 1}" into Group Chat \n in the main session or \n append "[${index + 1}]" to your name \n to be assigned to Breakout Room "${room.name}"`
            ).join('\n') +
            "\n" +
            "End of List"
    ),
)

var nameChange$ = store$.pipe(
    rxjs.operators.map(s => s.attendeesList.attendeesList),
    rxjs.operators.map(list => new Map(
        list.map(
            attendee => [attendee.userId, attendee.displayName]
        )
    )
    ),
    rxjs.operators.scan((acc, attendeesMap) => {
        if (acc === undefined) {
            return { previousMap: attendeesMap, changedNames: [] }
        }

        var changedNames = [];

        for (let [userId, displayName] of attendeesMap.entries()) {
            let oldDisplayName = acc.previousMap.get(userId);
            if (oldDisplayName != undefined && oldDisplayName != displayName) {
                changedNames.push({
                    oldDisplayName: oldDisplayName,
                    newDisplayName: displayName,
                    senderUserId: userId,
                });
            }
        }

        return { previousMap: attendeesMap, changedNames: changedNames }
    }, undefined),
    rxjs.operators.map((acc) => acc.changedNames),
    rxjs.operators.distinctUntilChanged(),
    rxjs.operators.filter((changedNames) => changedNames.length > 0),
    rxjs.operators.flatMap((changedNames) => rxjs.from(changedNames)),
)

var moveRequestQueryFromInitialNames$ = new rxjs.Subject();

var moveRequestQueryFromNameChange$ = nameChange$.pipe(
    // Only operate on names that change to a format requesting a room
    rxjs.operators.filter((changedNamePair) => {
        const regex = /\[(.+)\]/;
        return regex.test(changedNamePair.newDisplayName);
    }),
    // Ignore names that change but match the old name's query
    rxjs.operators.filter((changedNamePair) => {
        const regex = /\[(.+)\]/;
        var newNameTest = regex.test(changedNamePair.newDisplayName);
        var oldNameTest = regex.test(changedNamePair.oldDisplayName);
        if (newNameTest && oldNameTest) {
            var targetRoomNew = changedNamePair.newDisplayName.match(regex)[1]
            var targetRoomOld = changedNamePair.oldDisplayName.match(regex)[1]
            if (targetRoomNew == targetRoomOld) {
                return false;
            }
        }
        return true
    }),
    rxjs.operators.map((changedNamePair) => {
        const regex = /\[(.+)\]/;
        var targetRoomQuery = changedNamePair.newDisplayName.match(regex)[1]
        return {
            senderUserId: changedNamePair.senderUserId,
            sender: changedNamePair.newDisplayName,
            targetRoomQuery,
            src: 'nameChange'
        }
    }),
)

var chatMoveRequestCommand$ = userMessageMap$.pipe(
    rxjs.operators.filter(({ message }) => message.startsWith("!mv ")),
)

var moveRequestQueryFromChat$ = chatMoveRequestCommand$.pipe(
    rxjs.operators.map(({ sender, message, senderUserId }) => {
        const regex = /!mv (.+)/;
        var targetRoomQuery = message.match(regex)[1]
        return {
            sender: sender,
            senderUserId: senderUserId,
            targetRoomQuery: targetRoomQuery,
            src: 'chat'
        }
    }),
)

var moveRequestQuery$ = rxjs.merge(
    moveRequestQueryFromChat$,
    moveRequestQueryFromNameChange$,
    moveRequestQueryFromInitialNames$,
)

var [moveRequestSimpleIdQuery$, moveRequestStringQuery$] = moveRequestQuery$.pipe(
    rxjs.operators.partition(({ targetRoomQuery }) => /^\d+$/.test(targetRoomQuery))
)

var moveRequestSimpleIdQueryResolved$ = moveRequestSimpleIdQuery$.pipe(
    rxjs.operators.withLatestFrom(
        store$,
        ({ sender, targetRoomQuery, src, senderUserId }, storeState) => {
            var roomIndex = parseInt(targetRoomQuery, 10);

            if (roomIndex == 0 || roomIndex > storeState.breakoutRoom.roomList.length) {
                return { error: `⚠️ (from ${src})\n @${sender} Room ID "${targetRoomQuery}" out of range!\n` }
            }

            var room = storeState.breakoutRoom.roomList[roomIndex - 1]

            var roomName = room.name
            var roomUuid = room.boId

            return { sender, roomName, src, senderUserId, roomUuid }
        }
    ),
)

var moveRequestStringQueryResolved$ = moveRequestStringQuery$.pipe(
    rxjs.operators.withLatestFrom(
        store$,
        ({ sender, targetRoomQuery, src, senderUserId }, storeState) => {
            var results = fuzzysort.go(targetRoomQuery, storeState.breakoutRoom.roomList, { key: 'name' });
            if (results.length == 0) {
                return { error: `⚠️ (from ${src})\n @${sender} No names matched for query: ${targetRoomQuery}!\n` }
            }
            var roomName = results[0].obj.name;
            var roomUuid = results[0].obj.boId;

            return { sender, roomName, src, senderUserId, roomUuid }
        }
    ),
)

var moveRequestResolved$ = rxjs.merge(
    moveRequestSimpleIdQueryResolved$,
    moveRequestStringQueryResolved$,
)

var [moveRequestResolveError$, moveRequestResolved$] = moveRequestResolved$.pipe(
    rxjs.operators.partition(({ error }) => error),
)


var moveRequestChecked$ = moveRequestResolved$.pipe(
    rxjs.operators.withLatestFrom(
        store$,
        ({ sender, roomName, src, senderUserId, roomUuid }, storeState) => {
            var guidSenderMap = new Map(
                storeState.attendeesList.attendeesList.map(
                    attendee => [attendee.userGUID, attendee.displayName]
                )
            );

            var room = storeState.breakoutRoom.roomList.filter(room => room.name == roomName)[0]
            var roomAttendeesByName = room.attendeeIdList.map(attendeeId => guidSenderMap.get(attendeeId));

            if (roomAttendeesByName.includes(sender) && src == 'initialName') {
                // Don't return errors
                return null
            }

            if (roomAttendeesByName.includes(sender)) {
                return { error: `⚠️ (from ${src})\n "${sender}" already in "${room.name}"\n` }
            }

            return { sender, roomName, src, senderUserId, roomUuid }
        }
    ),
    rxjs.operators.filter(item =>
        item != null
    )
)

var [moveRequestInvalidError$, moveRequestValid$] = moveRequestChecked$.pipe(
    rxjs.operators.partition(({ error }) => error),
)

var moveRequestValidTimeSlice$ = rxjs.interval(10);

var moveRequestValidTimeSliceQueue$ = rxjs.zip(moveRequestValid$, moveRequestValidTimeSlice$).pipe(
    rxjs.operators.map(([s, _d]) => s)
)

var moveRequestError$ = rxjs.merge(
    moveRequestResolveError$,
    moveRequestInvalidError$,
)

var moveRequestErrorsAndSuccess$ = rxjs.merge(
    moveRequestError$,
    moveRequestValidTimeSliceQueue$
)

var moveFulfillChatResponse$ = new rxjs.Subject();

var moveFulfillChatResponseBuffered$ = moveFulfillChatResponse$.pipe(
    rxjs.operators.bufferTime(1000),
    rxjs.operators.map( messages => {
        if (messages.length == 1) {
            return messages[0]
        } else {
            return `🎯 Assigned ${messages.length} users over the last second.`
        }
    })
);

// SUBSCRIPTIONS

var versionReplySubscription = versionReply$.subscribe(
    (message) => chatboxSend(message)
)

var breakoutRoomListReplySubscription = breakoutRoomListReply$.subscribe(
    (message) => chatboxSend(message)
)

var moveRequestFulfillNotifySubscription = moveRequestErrorsAndSuccess$.subscribe(
    ({ sender, roomName, src, error, senderUserId, roomUuid }) => {
        if (error) {
            chatboxSend(error);
            return;
        }
        try {
            // old UI Automation Way
            // assignedUnjoinedUserToBreakoutRoom(sender, roomName);
            // ~ 2ms
            assignUserIdToBreakoutRoomUuid(senderUserId, roomUuid)
            moveFulfillChatResponse$.next(`🎯 (from ${src})\n Assigning\n "${sender}"\n to\n "${roomName}"\n` +
            "❓ You may need to press the Breakout Rooms button\n to join the newly assigned breakout meeting.\n❓ Chat \"!ls\" to list rooms and other commands.\n")
        } catch {

        }
    }
)

var moveFullfillChatResponseSubscription = moveFulfillChatResponseBuffered$.subscribe( message => {
    // ~ 30ms
    chatboxSend(message)
})

// Open the chat pane if it isn't already open.
var chatPaneButton = document.querySelector('[aria-label^="open the chat pane"]')
if (chatPaneButton) {
    chatPaneButton.click();
}

setTimeout(_ => {
    chatboxSend(`Breakout Rooms Bot for Zoom Meetings ${BREAKOUT_ROOM_BOT_VERSION} activated.\n\nAttendees, chat "!ls" in main meeting chat to list rooms and commands.\nUse a "!mv" in main meeting chat or append a [<room id>] or [room name] in to your name to choose a room.\nChat commands only work in main meeting\n however renames are detected anywhere.\nUse the End Meeting button in the Breakout Room to return to the main meeting in order to use chat commands\n\nHost(s), please rename and dedicate this client for the bot and use another session to participate in the meeting.`)
}, 100)

// Move users after bot initialization
setTimeout(_ => {
    internalStore.getState().attendeesList.attendeesList.map(
        attendee => attendee.displayName
    ).filter(displayName => /\[.+\]/.test(displayName)).map(
        name => {
            return {
                sender: name,
                targetRoomQuery: name.match(/\[(.+)\]/)[1],
                src: 'initialName'
            }
        }
    ).forEach(moveRequest => {
        moveRequestQueryFromInitialNames$.next(moveRequest);
    });
}, 110)
