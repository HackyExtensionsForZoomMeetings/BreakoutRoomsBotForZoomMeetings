# Notes/Research for Hacky Zoom Breakout Bot

## Store Related

### Import RX

Copy and paste contents of https://unpkg.com/rxjs@6.6.2/bundles/rxjs.umd.min.js to the Console.

### Put store on `window`

Focus on the root element with Redux dev tools. *Needed for rest*.


```javascript
window.innerStore = $r.props.store;

```

### `GetState()`

```javascript
window.innerStore.getState()
```

### Intercept/Eval Store

```javascript
var originalDispatch = window.innerStore.dispatch;
var loggyDispatch = (action) => {
    console.log("loggyDispatch");
    console.log(action);
    originalDispatch(action)
};
window.innerStore.dispatch = loggyDispatch;
```

### State Changed


```javascript
var loggySubscriber = () => {
    console.log("state changed")
}
window.innerStore.subscribe(loggySubscriber);
```

## Chat Sending

## All-in-One Chat Sending

* Open Chat Window

```javascript
window.innerChatboxSend = (msg) => {
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
```

### Usable Native setter for TextArea

```javascript
var nativeTextAreaValueSetter = Object.getOwnPropertyDescriptor(window.HTMLTextAreaElement.prototype, "value").set;
nativeTextAreaValueSetter.call(chatbox, "i like fish and i cannot lie");
chatbox.dispatchEvent(new Event('input', { bubbles: true}));
```


### Working Keydown for Chrome

https://gist.github.com/ejoubaud/7d7c57cda1c10a4fae8c

```javascript
Podium = {};

Podium.keydown = function(k, el) {
    var oEvent = document.createEvent('KeyboardEvent');

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

    if (oEvent.initKeyboardEvent) {
        oEvent.initKeyboardEvent("keydown", true, true, document.defaultView, k, k, "", "", false, "");
    } else {
        oEvent.initKeyEvent("keydown", true, true, document.defaultView, false, false, false, false, k, 0);
    }

    oEvent.keyCodeVal = k;

    if (oEvent.keyCode !== k) {
        alert("keyCode mismatch " + oEvent.keyCode + "(" + oEvent.which + ")");
    }

    el.dispatchEvent(oEvent);
}

Podium.keydown(13, el);
```

### Send a mouseover

```javascript
function reactMouseOver(el) {
    var oEvent = document.createEvent('MouseEvent');
    oEvent.initMouseEvent("mouseover", true, true, window, 0, 0, 0, 0, 0, false, false, false, false, 0, null);
    el.dispatchEvent(oEvent);
}
```

### An unminified source but packaged version of redux for inspection:

https://cdnjs.cloudflare.com/ajax/libs/redux/4.0.5/redux.js

### An unminified source of Rx

https://unpkg.com/rxjs@6.6.2/bundles/rxjs.umd.js

## Moving Users to Bo Related

### Taxonomy

* Two types:
    * `assignUnassignedUserToBo`
        * User joins in while breakout rooms are in progress. But isn't assigned.
        * Assigned to `assignUnassignedUserToBo` via a `assignUnassignedUserToBo:`
    * `moveUserToBo`
        * User is already assigned to breakout room.
        * Assigned to `moveUserToBo` via a `moveUserToBo:`

* Dispatch these function calls.
* Arguments
    1. `userId`
        * Some numerical thing. Can be found in store.
    2. `zoomId`
        * Some hashy random string thing. Can be found in store
    3. `boId`
        * Some GUID that is the Breakout Room eg. `{C142B5E0-11D7-47AB-D65D-4AB7B638BC99}`, with curly braces.

### Functions of note:

* Something that checks if the user is the host and has `WS_CONF_BO_ASSIGN_REQ` in it
* Something that checks if the user is the host and has `WS_CONF_BO_ASSIGN_REQ` in it

### Rough Steps needed for emulation

1. Dispatch function to send command to backend
    * Cares if the user is already assigned. Must send different one
    * Will update GUI automatically!
    * Unreliable. Seems to lose scope/effectivity after a period.

## Make things visible

### Visible Breakout Rooms

```javascript
{
  type: 'SET_CHAT_TYPE',
  payload: 1
}
```

### Visible Chat

```javascript
{
  type: 'SET_CHAT_TYPE',
  payload: 1
}
```


[nomeetingchatapi]: https://devforum.zoom.us/t/in-meeting-chats/26572