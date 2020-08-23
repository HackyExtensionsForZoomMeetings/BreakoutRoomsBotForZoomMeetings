# Hacky Zoom Breakout "Bot"

This is a Zoom Meetings Breakout Room bot. It allows users to:

* List Breakout Rooms
* Self-Assign themselves to a Breakout Room.

This lends itself to uses in classrooms where some students are "TAs" or very large meetings. This bot was ini

There are absolutely no official APIs to do what this bot does. There is an [existing bot that uses CV on a Mac to perform this but it is limited by what a CV approach can see and do.][ocrbreakoutroombot]. Instead, this tries to hook into the React/Redux application to perform its logic. By this nature, **it is very hacky and is expected to break someday.**

Hopefully, great demand for such a feature will manifest in an API or support.

## Usage (As Host)

* You should dedicate a new browser session for this bot.
* The bot is required to run as the "Host" as only the host has access to Breakout room configuration.
    * This mea
* You should not use the


## Usage (As Attendee)

## Developer

Please see [RESEARCH.md](./RESEARCH.md).





[ocrbreakoutroombot]: https://github.com/ottoscholten/zoomChatBot