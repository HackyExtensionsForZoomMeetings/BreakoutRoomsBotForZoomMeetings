# Rough Design

1. Have user to have already
    * Start Breakout Rooms
    * Assign a user to a breakout room
    * Open Rooms
    * Have Breakout Rooms Window Open
    * Have Chat Window Open
1. Have React Devtools so that `$r.props.store.getState()` is available.
1. Using Browser Automation
    * Expand every list of the Breakout Room Window
1. Include RxJS into window
1. RxJS subscribe to state changes
1. Pipeline
    1. Chat Messages is scanned for commands
        * `!ls`
            - Send a message to the Chat with a list of breakout rooms and names with index
                - Simple call to Browser Automation
        * `!mv <roomIndex>`
            - Move the sending user to the Breakout Room
                - Check if the user's name is unique amongst all "(Not Joined) attendee elements in Breakout Window
                    - Respond with error in chat and stop
                - Find element with user's name and emulate a mouseOver
                - Click element to "Assign To" or "Move To"
                - Click element to assign to or move user to