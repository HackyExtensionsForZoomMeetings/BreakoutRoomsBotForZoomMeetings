# 2020.09.7 2020-09-12

* Reworked bot to use internal Zoom command websocket connection to assign and reassign users to breakout rooms. ~100ms per assignment to 2ms per assignment! Greatly reduced safety latency to 10ms as a result.
* Buffered chat messages per second for assignment notices (26ms per second vs 26ms per user assignment)
* Enhanced `!ls` to also take arguments for room name to match and list users
* Enhanced `!ls` to list number of users in a breakout room

# 2020.09.6 2020-09-08

* Upon attachment, assign users by their names

# 2020.09.5 2020-09-07

* Lower safety latency for assignments to 150ms by removing some "sleeps".

# 2020.09.4 2020-09-07

* Tweak newlines in chat responses

# 2020.09.3 2020-09-07

* Change room by name search and id! Works in both renames and `!mv`.

# v1.4 2020-09-03

* Change Room by name changing. Only supports ID-indexes for now.

# v1.3 2020-09-03

* Permit all subdomains underneath zoom.us, allowing enterprise/school use and location-specific servers.
