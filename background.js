'use-strict';

var validated = false;
var manifest = chrome.runtime.getManifest();

//  Authenticate logged in user interactively
function authenticate() {
    chrome.identity.getAuthToken(
        {'interactive': true},
        function(token) {
            if (chrome.runtime.lastError) {
                console.log("Error");
            } else {
                validateToken(token);
            }
        }
    );
}

//  Validate the given token
//  On success, store token in local storage
function validateToken(token) {
    var xhr = new XMLHttpRequest();
    xhr.open('GET', 'https://www.googleapis.com/oauth2/v3/tokeninfo?access_token=' + token);
    xhr.onload = function () {
        var data = JSON.parse(this.response);
        if (data.aud == manifest.oauth2.client_id) {
            //console.log("client_id matches");
            // store token in local storage
            localStorage.setItem('access_token', token);
            validated = true;
        } else {
            console.log("Invalid token (function: validateToken)");
        }
    }
    xhr.send();
}

function gmailAPIRequest(requestURL, callback) {
    var xhr = new XMLHttpRequest();
    xhr.open('GET', requestURL);
    //console.log(token);
    var access_token = localStorage.getItem('access_token');
    xhr.setRequestHeader('Authorization', 'Bearer ' + access_token);
    xhr.onload = callback;
    xhr.send();
}


function mailAlarm(alarm) {
    authenticate();
    if (validated) {
        gmailAPIRequest('https://www.googleapis.com/gmail/v1/users/me/messages?maxResults=1&labelIds=UNREAD&INBOX', function() {
            if (this.status == 401) {
                console.log(this.response);
            } else {
                var resp = JSON.parse(this.response);
                var message = resp.messages;

                //console.log('this message: ' + message[0].id);
                //console.log('lastMessage: ' + localStorage.getItem('lastMessage'));
                if (message && message[0].id != localStorage.getItem('lastMessage')) {
                    //console.log('making notifications (mailAlarm)');
                    makeNotification(message);
                } else {
                    console.log('no new messages');
                }
            }
        });
    } else {
        // token invalid
    }
}


function makeNotification(message) {
    var stop = false;
    message = message[0];

    gmailAPIRequest('https://www.googleapis.com/gmail/v1/users/me/messages/' + message.id, function() {
        if (this.status == 401) {
            console.log(this.response);
        } else {
            var resp = JSON.parse(this.response);
                // make notification
                
                var headers = resp.payload.headers;
                for (i = 0; i < headers.length; i++) {
                    var header = headers[i];
                    if (header.name == 'From') {
                        var regex = /\<(.*?)\>/;
                        from = regex.exec(header.value)[1];
                    } else if (header.name == 'Subject') {
                        var sub = header.value;
                    }
                }

                var title = 'From: ' + from + '\n' + 'Subject: ' + sub;
                var msg = resp.snippet;
                chrome.notifications.create('checkMail', {
                    type: 'basic',
                    iconUrl: 'new_mail.png',
                    title: title,
                    message: msg
                });

                //console.log('id: ' + resp.id);
                //console.log('notification: ' + resp.snippet);
        }
    });

    localStorage.setItem('lastMessage', message.id);
    //console.log('lastMessage set');
}

chrome.alarms.create('checkMail', {periodInMinutes:0.5});
chrome.alarms.onAlarm.addListener(mailAlarm);
