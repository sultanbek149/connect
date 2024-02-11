var highlighted = []
var holdings = 0;

var dragging = false;
var dragStartX = 0;
var dragStartY = 0;

var windowPosX = 500;
var windowPosY = 200;

var mousePosX = 0;
var mousePosY = 0;

var deltaX = 0;
var deltaY = 0;

var windows = {};
var windowQueue = [];

var currentWindow = null;

var holdingsWindow;
var youtubeWindow;
var uniswapWindow;
var dialupWindow;
var minesweeperWindow;
var pinballWindow;
var messageWindow;
var twitterWindow;
var notepadWindow;
var folderWindow;
var startMenu;

var errorWindow;
var glitchEffect;
var notfound;

var chatElement;

// has user color been set
var colorSet = false;
// history has been fetched;
var historySet = false;
// stored name has been pulled;
var nameSet = false;
// current name is valid
var validName = false;
// is emoji menu open
var emojisOpen = false;

const url = "http://localhost:3000";

const framerate = 144;

setInterval(async () => {
    if (holdingsWindow == undefined || startMenu == undefined || youtubeWindow == undefined || uniswapWindow == undefined || twitterWindow == undefined || notepadWindow == undefined) {
        holdingsWindow = document.getElementById("holdings");
        startMenu = document.getElementById("start-menu");
        youtubeWindow = document.getElementById("youtube");
        uniswapWindow = document.getElementById("uniswap");
        dialupWindow = document.getElementById("dial-up");
        pinballWindow = document.getElementById("pinball");
        messageWindow = document.getElementById("message");
        minesweeperWindow = document.getElementById("minesweeper");
        twitterWindow = document.getElementById("twitter");
        notepadWindow = document.getElementById("notepad");
        chatElement = document.getElementById("chat");



        if (document.getElementById("color") && colorSet == false) {
            setRandomColor();
            colorSet = true;
        }

        if (document.getElementById("chat") && historySet == false) {
            setChatHistory();
            historySet = true;
        }

        if (document.getElementById("name") && nameSet == false) {
            let storedName = getCookie("username");
            if (storedName !== null) {
                checkNameValidity(storedName);
                document.getElementById("name").value = storedName;
            }
            historySet = true;
        }
    }

    if (errorWindow == null) {
        errorWindow = document.getElementById("error");
        console.log(errorWindow);
        errorWindow.style.display = "none";
        // await createError();
    }

    if (glitchEffect == null) {
        glitchEffect = document.getElementById("defaultCanvas0");
        if (glitchEffect !== null) {
            glitchEffect.style.display = "none";
        }
    }

    if (notfound == null) {
        notfound = document.getElementById("notfound");
        if (notfound !== null) {
            notfound.style.display = "none";
        }
    }

    if (dragging == true) {
        // deltaX = (mousePosX - dragStartX);
        // deltaY = (mousePosY - dragStartY);
        windows[document.title].delta.x = (mousePosX - dragStartX);
        windows[document.title].delta.y = (mousePosY - dragStartY);

        setWindowPos(
            currentWindow,
            windows[document.title].pos.x + windows[document.title].delta.x,
            windows[document.title].pos.y + windows[document.title].delta.y
        );
        // setWindowPos(currentWindow, windowPosX + deltaX, windowPosY + deltaY);
        // change z index when window is focused or is 'currentWindow'
        /*  
            {
                "Pinball": {
                    "delta": {
                        "x": 0,
                        "y": 0
                    },
                    "pos": {
                        "x": 0,
                        "y": 0
                    }
                    "element": [Object]
                }
            }
        */
    }

    // start deleting chat messages after 400 to prevent lag
    if (chatElement.children.length > 400) {
        chatElement.children[0].remove();
    }

    // if (currentWindow !== document.getElementById("youtube")) {
    //     stopVideo();
    // }

    // updateClock();
}, (1 / framerate) * 1000);

// setInterval(getTotalOnline, 5000);

initWindows();

function initWindows() {
    const titles = [
        "YouTube",
        "Uniswap",
        "Minesweeper",
        "Pinball",
        "mIRC",
        "Twitter",
        "Holdings",
        "Notepad",
        "Recycle Bin",
    ];

    titles.forEach(title => {
        windows[title] = {};
        windows[title]["pos"] = {
            "x": 500,
            "y": 150
        };
        windows[title]["delta"] = {
            "x": 0,
            "y": 0
        };
        windows[title]["focused"] = false;
        windows[title]["element"] = undefined;
    });
}

function toggleEmojis() {
    if (emojisOpen) {
        hideEmojis();
    }
    else {
        showEmojis();
    }
}

function showEmojis() {
    document.getElementById("emoji-menu").style.display = "block";
    emojisOpen = true;
}

function hideEmojis() {
    document.getElementById("emoji-menu").style.display = "none";
    emojisOpen = false;
}

function sendEmoji(event) {
    const name = document.getElementById("name").value;
    const color = document.getElementById("color").value;
    const fileName = event.target.src;

    let emojiId = 0;
    let animated = false;
    if (fileName.includes('gif')) {
        emojiId = fileName.slice(fileName.lastIndexOf("/") + 1, fileName.lastIndexOf("."));
        animated = true;
    }
    else if (event.target.src.includes('png')) {
        emojiId = fileName.slice(fileName.lastIndexOf("/") + 1, fileName.lastIndexOf("."));
    }

    hideEmojis();

    socket.send(JSON.stringify({
        "username": name,
        "color": color,
        "emojiId": emojiId,
        "animated": animated,
        "type": "emoji"
    }));
}

function setCookie(name, value, daysToExpire) {
    const date = new Date();
    date.setTime(date.getTime() + (daysToExpire * 24 * 60 * 60 * 1000));
    const expires = "expires=" + date.toUTCString();
    document.cookie = name + "=" + value + ";" + expires + ";path=/";
}

// Function to get the value of a cookie by name
function getCookie(name) {
    const cookieString = document.cookie;
    const cookies = cookieString.split('; ');
    for (let i = 0; i < cookies.length; i++) {
        const cookie = cookies[i].split('=');
        if (cookie[0] === name) {
            return cookie[1];
        }
    }
    return null;
}

async function setChatHistory() {
    await fetch(url + "/history")
        .then(response => {
            if (!response.ok) {
                throw new Error(`HTTP error! Status: ${response.status}`);
            }
            return response.json();
        })
        .then(history => {
            history.forEach(msg => {
                const data = JSON.parse(msg);
                const msgType = data.type;

                let container;
                let username;
                let admin;
                let text;
                let connect;
                let chat;
                let emoji;

                // create a chat message on the dom and scroll box to the bottom
                switch (msgType) {
                    case "chat":
                        container = document.createElement('div');
                        container.className = 'msg';
                        container.setAttribute('uid', data.uid);

                        if (data.admin) {
                            admin = document.createElement('div');
                            admin.className = 'admin';
                            admin.textContent = "👑";
                            container.appendChild(admin);
                        }

                        username = document.createElement('div');
                        username.className = 'username';
                        username.textContent = data.username + ":";
                        username.style.color = data.color;
                        username.onclick = () => {
                            let tempInput = document.createElement("input");
                            tempInput.value = data.uid;
                            document.body.appendChild(tempInput);
                            tempInput.select();
                            document.execCommand("copy");
                            document.body.removeChild(tempInput);
                        }
                        container.appendChild(username);

                        text = document.createElement('div');
                        text.className = 'text';
                        text.textContent = data.msg;
                        container.appendChild(text);

                        // Append msg to DOM
                        chat = document.getElementById("chat");
                        chat.appendChild(container);
                        chat.scrollTop = chat.scrollHeight;
                        break;
                    case "connect":
                        // container = document.createElement('div');
                        // container.className = 'msg';

                        // connect = document.createElement('div');
                        // connect.className = 'msg';
                        // connect.textContent = data.username + " has connected.";
                        // // username.style.color = data.color;
                        // container.appendChild(connect);

                        // // Append msg to DOM
                        // chat = document.getElementById("chat");
                        // chat.appendChild(container);
                        // chat.scrollTop = chat.scrollHeight;
                        break;
                    case "emoji":
                        container = document.createElement('div');
                        container.className = 'msg';
                        container.setAttribute('uid', data.uid);

                        if (data.admin) {
                            admin = document.createElement('div');
                            admin.className = 'admin';
                            admin.textContent = "👑";
                            container.appendChild(admin);
                        }

                        username = document.createElement('div');
                        username.className = 'username';
                        username.textContent = data.username + ":";
                        username.style.color = data.color;
                        username.onclick = () => {
                            let tempInput = document.createElement("input");
                            tempInput.value = data.uid;
                            document.body.appendChild(tempInput);
                            tempInput.select();
                            document.execCommand("copy");
                            document.body.removeChild(tempInput);
                        }
                        container.appendChild(username);

                        emoji = document.createElement('img');
                        emoji.className = 'emoji';
                        if (data.animated) {
                            emoji.src = "img/emoji/" + data.emojiId + ".gif";
                        }
                        else {
                            emoji.src = "img/emoji/" + data.emojiId + ".png";
                        }
                        container.appendChild(emoji);

                        // Append msg to DOM
                        chat = document.getElementById("chat");
                        chat.appendChild(container);
                        chat.scrollTop = chat.scrollHeight;
                        break;
                }
            })
            //document.getElementById("online").innerText = "🟢 " + output;
        })
        .catch(error => {
            console.error("Fetch error:", error);
        });
}

async function getTotalOnline() {
    await fetch(url + "/online")
        .then(response => {
            if (!response.ok) {
                throw new Error(`HTTP error! Status: ${response.status}`);
            }
            return response.json();
        })
        .then(data => {
            let output = data.totalOnline;
            document.getElementById("online").innerText = "🟢 " + output;
        })
        .catch(error => {
            console.error("Fetch error:", error);
        });
}

async function checkNameValidity(username) {
    await fetch(url + "/checkAvailability?username=" + username)
        .then(response => {
            if (!response.ok) {
                throw new Error(`HTTP error! Status: ${response.status}`);
            }
            return response.json();
        })
        .then(data => {
            let output = data;
            if (output == false) {
                document.getElementById("invalid").style.display = "block";
            }
            else {
                document.getElementById("invalid").style.display = "none";
            }
            validName = output;
        })
        .catch(error => {
            console.error("Fetch error:", error);
        });
}

document.onmousedown = () => {
    // setWindowPos(currentWindow, mousePosX - dragStartX, mousePosY - dragStartY);
}

document.onmouseup = () => {
    // dragging = false;
    if (dragging == true) {
        // end any dragging
        endDrag();
    }
}

document.onmousemove = handleMouseMove;
function handleMouseMove(event) {
    mousePosX = event.clientX;
    mousePosY = event.clientY;
}

addEventListener("mouseup", (event) => {
    if (event.target.className !== "icon") {
        removeAllHighlights();
    }
});

function focusWindow(title) {
    document.title = title;

    const titles = Object.keys(windows);
    titles.forEach(window => {
        if (window !== title) {
            windows[window].focused = false;
            if (windows[window].element !== undefined) {
                windows[window].element.style.zIndex = 2;
            }
        }
    })
}

function hideWindow(xButton) {
    dragging = false;

    if (document.title == "Pinball") {
        try {
            document.getElementById("pinball-container").remove();
        } catch { }
    }

    // Remove current window from queue
    windowQueue.pop();
    if (windowQueue.length > 0) {
        document.title = windowQueue[windowQueue.length - 1];
    }
    else {
        // If queue is empty show desktop
        document.title = "Desktop";
    }
    stopVideo();
    // Hide window
    xButton.parentNode.parentNode.style.display = 'none';
}

function showWindow(element, title) {
    document.title = title;

    element.style.zIndex = 5;
    windows[title].element = element;
    focusWindow(title);

    setWindowPos(element, windows[title].pos.x, windows[title].pos.y);
    stopVideo();
    // Hide window
    element.style.display = 'block';
    if (title == "Minesweeper" || title == "Pinball") {
        element.style.display = 'flex';
    }
    if (title == "mIRC") {
        const chat = document.getElementById("chat");
        chat.scrollTop = chat.scrollHeight;
    }
    if (title == "Pinball") {
        // if (!document.getElementById("pinball-container")) {
        let pinballContainer = document.createElement("div");
        pinballContainer.className = "pinball-container";
        pinballContainer.id = "pinball-container";
        pinballContainer.style.display = "flex";
        pinballContainer.style.flexWrap = "nowrap";

        let embed = document.createElement("embed");
        embed.type = "text/html";
        embed.id = "pinball-game";
        embed.src = "pinball/index.html";
        embed.width = "625";
        embed.height = "500";

        const controls = document.getElementById('controls');

        pinballContainer.appendChild(embed);
        document.getElementById("pinball").appendChild(pinballContainer);
        document.getElementById("pinball").insertBefore(pinballContainer, controls);
        // }
    }
}

function beginDrag(element) {
    console.log(document.title);
    let title = element.children[0].textContent.trim();
    element.style.zIndex = 5;
    focusWindow(title);

    currentWindow = element;
    currentWindow.childNodes[1].style.cursor = "grabbing";
    dragStartX = mousePosX;
    dragStartY = mousePosY;

    dragging = true;
}

function endDrag() {
    // windowPosX += deltaX;
    // windowPosY += deltaY;
    windows[document.title].pos.x += windows[document.title].delta.x;
    windows[document.title].pos.y += windows[document.title].delta.y;
    currentWindow.childNodes[1].style.cursor = "grab";
    // currentWindow = null;
    dragging = false;
}

function setWindowPos(element, x, y) {
    element.style.top = y + 'px';
    element.style.left = x + 'px';
}

function holdButton(element) {
    /*element.style.borderTop = "3px solid #1d1d1d";
    element.style.borderLeft = "3px solid #1d1d1d";
    element.style.borderBottom = "3px solid #fff";
    element.style.borderRight = "3px solid #fff";*/
}

function releaseButton(element, callback) {
    /*element.style.borderTop = "3px solid #fff";
    element.style.borderLeft = "3px solid #fff";
    element.style.borderBottom = "3px solid #1d1d1d";
    element.style.borderRight = "3px solid #1d1d1d";*/
}

function highlight(element) {
    element.style.background = "blue";
    element.children[0].style.opacity = 0.25;
    if (highlighted.indexOf(element) == -1) {
        highlighted.push(element);
    }
}

function removeHighlight(element) {
    element.style.background = "none";
    element.children[0].style.opacity = 1;
}

function removeAllHighlights() {
    for (var i = 0; i < highlighted.length; i++) {
        element = highlighted[i];
        removeHighlight(element);
    }
}

function sleep(milliseconds) {
    return new Promise(resolve => setTimeout(resolve, milliseconds));
}

async function createError() {
    const error = document.getElementById("error");
    error.style.display = "block";
    const root = document.getElementById("body");

    let audios = [];

    const TOTAL_WINDOWS = 14;
    for (var i = 0; i < TOTAL_WINDOWS; i++) {
        const newError = error.cloneNode(true);

        const xPos = (39.5 - (2 * (i + 1))).toString() + "vw";
        const yPos = (350 - (30 * (i + 1))).toString() + "px";

        // start glitch halfway through
        if (i >= 4) {
            glitchEffect.style.display = "block";
        }

        newError.style.top = yPos;
        newError.style.left = xPos;

        root.appendChild(newError);
        // Pause all currently playing error noises
        audios.map((clip) => {
            clip.pause();
        });
        let audio = new Audio("error_sfx.mp3");
        audios.push(audio);
        audio.play();
        await sleep(100);
    }

    // 2 seconds later show 404 page
    setTimeout(() => {
        // notfound.style.display = "block";
        // hide 404 page / glitch and show successful connection
        setTimeout(() => {
            // notfound.style.display = "none";
            // delete glitch effect
            glitchEffect.remove();
            document.getElementById("vignette").style.display = "block";
            document.getElementById("dial-up").style.display = "block";
            onConnected();
        }, 2000);
    }, 1000);

    // hide vignette and errors
    document.getElementById("vignette").style.display = "none";
    const errors = document.getElementsByClassName("error");
    for (var i = 0; errors.length; i++) {
        console.log(errors[i]);
        errors[i].style.display = "none";
        // errors[i].remove();
    }
}

function playDial() {
    // Transition
    document.getElementById("connecting").style.display = "block";
    document.getElementById("dial-info").style.display = "none";
    document.getElementById("connected").style.display = "none";

    var audio = new Audio("audio_short.mp3");
    audio.play();
    // Enable normal desktop
    setTimeout(() => {
        // hide dial up
        document.getElementById("dial-up").style.display = "none";
        // display errors
        createError();
    }, 5000)
}

function onConnected() {
    document.getElementById("connected").style.display = "block";
    document.getElementById("connecting").style.display = "none";

    var audio = new Audio("success.mp3");
    audio.play();
}

function confirmConnected() {
    document.getElementById("vignette").style.display = "none";
    document.getElementById("connected").style.display = "block";
    document.getElementById("dial-up").style.display = "none";
}

function updateClock() {
    let clock = document.getElementById("clock");
    let timeString = new Date().toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit'
    });
    clock.innerText = timeString;
}

/**
 * YT Player API
 */
var tag = document.createElement('script');

tag.src = "https://www.youtube.com/iframe_api";
var firstScriptTag = document.getElementsByTagName('script')[0];
firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);

var player;
function onYouTubeIframeAPIReady() {
    player = new YT.Player('player', {
        height: '50%',
        width: '50%',
        videoId: 'jNQXAC9IVRw',
        autoplay: '0',
        playerVars: {
            'playsinline': 1,
            'autoplay': 0
        },
        events: {
            'onReady': onPlayerReady,
            'onStateChange': onPlayerStateChange
        }
    });
}

function onPlayerReady(event) {
    // event.target.playVideo();
}

var done = false;
function onPlayerStateChange(event) {

}
function stopVideo() {
    player.stopVideo();
}

function setRandomColor() {
    // Get a random color in hexadecimal format (#RRGGBB)
    var randomColor = getRandomHexColor();

    // Get the color picker input element by its ID
    var colorPicker = document.getElementById("color");

    // Set the value of the color picker input to the random color
    colorPicker.value = randomColor;
}

function getRandomHexColor() {
    // Generate a random hexadecimal color value
    var letters = "0123456789ABCDEF";
    var color = "#";
    for (var i = 0; i < 6; i++) {
        color += letters[Math.floor(Math.random() * 16)];
    }
    return color;
}

async function banUser(uid) {
    let output;
    await fetch(url + "/ban", {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            "uid": uid
        })
    })
        .then(response => {
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }
        })
}

let keysPressed = {};

function handleKeyDownChat(event) {
    keysPressed[event.key] = true; // Set the key as pressed

    const name = document.getElementById("name").value;
    const color = document.getElementById("color").value;

    // store username in cookie
    setCookie("username", name, 30);

    // check if enter is pressed without shift being held
    if (!keysPressed['Shift']) {
        if (keysPressed['Enter']) {
            event.preventDefault();
            if (validName) {
                if (event.target.value.includes("/ban")) {
                    const user = event.target.value.split(" ")[1];
                    banUser(user);
                    // clear chat box
                    event.target.value = "";
                    return;
                }

                // send message
                if (socket && event.target.value !== "") {
                    socket.send(JSON.stringify({
                        "username": name,
                        "msg": event.target.value,
                        "color": color,
                        "type": "chat"
                    }));
                    // clear chat box
                    event.target.value = "";
                }
            }
        }
    }
}

function handleKeyUpChat(event) {
    delete keysPressed[event.key]; // Remove the key from the object
}

// Create a WebSocket connection
const socket = new WebSocket('ws://localhost:8080');

// Event handler for when the WebSocket connection is opened
socket.addEventListener('open', (event) => {
    console.log('WebSocket connection opened:', event);

    // load name from storage if possible
    let storedName = getCookie("username");

    if (storedName !== null) {
        socket.send(JSON.stringify({
            "username": storedName,
            "type": "connect"
        }));
    }
});

// Event handler for receiving messages from the server
socket.addEventListener('message', (event) => {
    const data = JSON.parse(event.data);
    const msgType = data.type;

    let container;
    let admin;
    let username;
    let text;
    let connect;
    let chat;

    // create a chat message on the dom and scroll box to the bottom
    switch (msgType) {
        case "chat":
            container = document.createElement('div');
            container.className = 'msg';
            container.setAttribute('uid', data.uid);

            if (data.admin) {
                admin = document.createElement('div');
                admin.className = 'admin';
                admin.textContent = "👑";
                container.appendChild(admin);
            }

            username = document.createElement('div');
            username.className = 'username';
            username.textContent = data.username + ":";
            username.style.color = data.color;
            username.onclick = () => {
                let tempInput = document.createElement("input");
                tempInput.value = data.uid;
                document.body.appendChild(tempInput);
                tempInput.select();
                document.execCommand("copy");
                document.body.removeChild(tempInput);
            }
            container.appendChild(username);

            text = document.createElement('div')
            text.className = 'text';
            text.textContent = data.msg;
            container.appendChild(text);

            // Append msg to DOM
            chat = document.getElementById("chat");
            chat.appendChild(container);
            chat.scrollTop = chat.scrollHeight;
            break;
        case "connect":
            // container = document.createElement('div');
            // container.className = 'msg';

            // connect = document.createElement('div');
            // connect.className = 'msg';
            // connect.textContent = data.username + " has connected.";
            // // username.style.color = data.color;
            // container.appendChild(connect);

            // // Append msg to DOM
            // chat = document.getElementById("chat");
            // chat.appendChild(container);
            // chat.scrollTop = chat.scrollHeight;
            break;
        case "emoji":
            container = document.createElement('div');
            container.className = 'msg';
            container.setAttribute('uid', data.uid);

            if (data.admin) {
                admin = document.createElement('div');
                admin.className = 'admin';
                admin.textContent = "👑";
                container.appendChild(admin);
            }

            username = document.createElement('div');
            username.className = 'username';
            username.textContent = data.username + ":";
            username.style.color = data.color;
            username.onclick = () => {
                let tempInput = document.createElement("input");
                tempInput.value = data.uid;
                document.body.appendChild(tempInput);
                tempInput.select();
                document.execCommand("copy");
                document.body.removeChild(tempInput);
            }
            container.appendChild(username);

            emoji = document.createElement('img');
            emoji.className = 'emoji';
            if (data.animated) {
                emoji.src = "img/emoji/" + data.emojiId + ".gif";
            }
            else {
                emoji.src = "img/emoji/" + data.emojiId + ".png";
            }
            container.appendChild(emoji);

            // Append msg to DOM
            chat = document.getElementById("chat");
            chat.appendChild(container);
            chat.scrollTop = chat.scrollHeight;
            break;
        case "ping":
            socket.send(JSON.stringify({
                "type": "pong"
            }));
            break;
    }
});

// Event handler for when the WebSocket connection is closed
socket.addEventListener('close', (event) => {
    if (event.wasClean) {
        console.log('WebSocket connection closed cleanly:', event);
    } else {
        console.error('WebSocket connection died:', event);
    }
});

// Event handler for WebSocket errors
socket.addEventListener('error', (error) => {
    console.error('WebSocket error:', error);
});
