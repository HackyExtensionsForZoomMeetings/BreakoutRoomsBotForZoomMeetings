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
window.innerStore.store.subscribe(loggySubscriber);
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




[nomeetingchatapi]: https://devforum.zoom.us/t/in-meeting-chats/26572