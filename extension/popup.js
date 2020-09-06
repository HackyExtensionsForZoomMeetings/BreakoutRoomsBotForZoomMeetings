// Copyright 2018 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

'use strict';

let launcher = document.getElementById('launcher');

launcher.onclick = function (element) {
    chrome.tabs.query(
        { active: true, currentWindow: true },
        function (tabs) {
            var rxjsUrl = chrome.runtime.getURL('rxjs.umd.js')
            chrome.tabs.executeScript(
                tabs[0].id,
                {
                    code: 'var rxjs = document.createElement("script");' +
                        `rxjs.setAttribute("src","${rxjsUrl}");` +
                        'document.head.appendChild(rxjs);'
                }
            );

            var fuzzySortUrl = chrome.runtime.getURL('fuzzysort.js')
            chrome.tabs.executeScript(
                tabs[0].id,
                {
                    code: 'var rxjs = document.createElement("script");' +
                        `rxjs.setAttribute("src","${fuzzySortUrl}");` +
                        'document.head.appendChild(rxjs);'
                }
            );

            var url = chrome.runtime.getURL('BreakoutRoomBot.js')
            setTimeout(_ => {
                chrome.tabs.executeScript(
                    tabs[0].id,
                    {
                        code: 'var bbSource = document.createElement("script");' +
                            `bbSource.setAttribute("src","${url}");` +
                            'document.head.appendChild(bbSource);'
                    }
                );
            }, 300);
        }
    );
    launcher.disabled = true;
}
