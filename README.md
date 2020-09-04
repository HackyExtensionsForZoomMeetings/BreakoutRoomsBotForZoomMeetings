# Breakout Room Bot for Zoom Meetings Chrome Extension

*Making it possible for **everyone** to walk around to other Breakout Rooms in a Zoom Meeting without the aid of the Host*

TODO: Video Showcase/Tutorial/Demo

## Usage (As Host)

1. Install the extension from the Chrome Web Store @ https://chrome.google.com/webstore/detail/breakout-room-bot-for-zoo/acfkhlojnkihdmgikmkilfjkapkemcnd?hl=en&authuser=0
    * Alternatively, clone or download a copy of this repository down and look for instructions online for loading "unpacked extensions" into Chrome or any other Chromium browser. Load the `extension` folder.
2. Go to the Zoom Meeting as the Host in a "Join from Browser" Zoom Meetings Web Client.
3. Ensure the Breakout Rooms are already open
4. Click the extension button in the menu bar to open the popup
    ![](launch.png)
5. Click the button to "Attach and Launch Breakout Room Bot"

## Usage (As Attendee)

**These commands only work in the main or root Zoom meeting**. If you're in a breakout room, you can return to the main or root Zoom meeting from a Breakout room by selecting End Meeting in a Breakout Room and selecting Leave Breakout room.

* `!ls` List Rooms
* `!mv <room id>` Move to breakout room ID. List of IDs can be found with `!ls`.
    * An alternate interface is to rename yourself and append a `[Room<id>]` or change the `[Room<id>]` suffix of your name. Unlike Chat commands, this *also works inside Breakout rooms*!
* `!version` Have the bot print out the version.

## Developer

* Zip the extension folder and upload it to the Chrome Web Store.

## License

MIT

## Credit

This is likely cobbled together from piles of stackoverflow, random Google Searches, and contributors.

[breakoutroominfo]: https://support.zoom.us/hc/en-us/articles/206476093-Enabling-breakout-rooms
[ocrbreakoutroombot]: https://github.com/ottoscholten/zoomChatBot
[desertpyhack]: https://www.meetup.com/Phoenix-Python-Meetup-Group/events/272227324/
[desertpy]: https://www.meetup.com/Phoenix-Python-Meetup-Group
