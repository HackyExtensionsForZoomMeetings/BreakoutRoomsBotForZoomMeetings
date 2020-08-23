# Notes/Research for Hacky Zoom Breakout Bot

## Import RX

Copy and paste contents of https://unpkg.com/rxjs@6.6.2/bundles/rxjs.umd.min.js to the Console.


## Intercept/Eval Store

Focus on the root element with Redux dev tools.

```javascript
var originalDispatch = $r.props.store.dispatch;
var loggyDispatch = (action) => {
    console.log("loggyDispatch");
    console.log(action);
    originalDispatch(action)
};
$r.props.store.dispatch = loggyDispatch;

```

## State Changed


```javascript
var loggySubscriber = () => {
    console.log("state changed")
}
$r.props.store.subscribe(loggySubscriber);
```

## Usable Native setter for TextArea

```javascript
var nativeTextAreaValueSetter = Object.getOwnPropertyDescriptor(window.HTMLTextAreaElement.prototype, "value").set;
nativeTextAreaValueSetter.call(chatbox, "i like fish and i cannot lie");
chatbox.dispatchEvent(new Event('input', { bubbles: true}));
```


## Working Keydown for Chrome

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