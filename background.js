//OAuth2
chrome.identity.getAuthToken(
    {'interactive': true},
    function(){
        window.gapi_onload = authorize();
        loadScript('https://apis.google.com/js/client.js');
    }
);

function loadScript(url) {
    var request = new XMLHttpRequest();

    request.onreadystatechange = function(){
        if (request.readystate != 4) {
            return;
        }

        if (request.status != 200) {
            return;
        }

        eval(request.ResponseText);
    };

    request.open('GET', url);
    request.send();
}

function authorize() {
    if (gapi){
        console.log("authorized");
    } else {
        console.log("not authorized");
    }
    gapi.auth.authorize(
        {
            clientid: '123243066664-mc0cjr4q5cv9o3bgl73vq6gvfrdsjluo.apps.googleusercontent.com',
            immediate: true,
            scope: 'https://www.googleapis.com/auth/gmail.modify'
        },
        function() {
            gapi.client.load('gmail', 'v1', gmailAPILoaded);
        }
    );
}

// gets the first 5 messages in mailbox
function getMessages(userId, callback) {
    /*
    var request = gapi.client.gmail.users.messages.get({
        'userId': userId,
        'id': messageId
    });
    request.execute(callback);
    */
    var request = gapi.client.gmail.users.messages.list({
        'userId': userId,
        'maxResults': 5,
    });
    request.execute(callback)
}

function getFirstMessage() {
    getMessages('me', function(response) {
        var firstMessage = response.messages[0]
        var headers = firstMessage.payload.headers
        chrome.notifications.create('checkMail', {
            type: 'basic',
            iconUrl: 'new_mail.png',
            title: 'New Mail!',
            message: headers[0]
        });
    })
}

function mailAlarm(alarm) {
    /*
    chrome.notifications.create('checkMail', {
        type: 'basic',
        iconUrl: 'new_mail.png',
        title: 'New Mail!',
        message: 'This is a new message.'
    });
    */
    getFirstMessage();
}

chrome.alarms.create('checkMail', {periodInMinutes:0.5});

chrome.alarms.onAlarm.addListener(mailAlarm);
