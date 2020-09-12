# General internal notes

## `commandSocket`

### Events

* (Re)Assignments / Only usable when rooms are already opened
    * 4179
        * Assign user who is currently unassigned
        * `{"evt":4179,"body":{"targetBID":"{8E4DFFD3-D7C0-CFC0-D472-E4EC556F12AF}","targetID":16781312},"seq":32}`

    * 4181
        * Reassign existing already-assigned user
        * `{"evt":4181,"body":{"targetBID":"{8E4DFFD3-D7C0-CFC0-D472-E4EC556F12AF}","targetID":16781312},"seq":32}`
            * `targetBID` is breakout room UUID

    * `targetBID` is breakout room UUID
        * Find in store at `breakoutRoom.roomList`
    * `targetID` is user ID
        * Find in store at `attendeesList.attendeesList`

Here are some events that might be too opaque

* 4174
    * Create Rooms
* 7950
    * Room Opening
    * "proto", protocol buffer?
