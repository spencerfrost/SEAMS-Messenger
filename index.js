var config = {
  apiKey: "AIzaSyBEDEGGuy0DaKgrXa6DIVwv_Eouor0u1wI",
  authDomain: "seams-messenger.firebaseapp.com",
  databaseURL: "https://seams-messenger.firebaseio.com",
  projectId: "seams-messenger",
  storageBucket: "seams-messenger.appspot.com",
  messagingSenderId: "879292557404"
};
firebase.initializeApp(config);

var currentUser;
var base = firebase.database();
var auth = firebase.auth();
var convos = [];
const blue = '#1976D2';
const orange = '#F18F01';
const pink = '#A23B72';

window.addEventListener("DOMContentLoaded", onDeviceReady, false);
window.onbeforeunload = function (event) {
  // do stuff here
  signOut();
};

function onDeviceReady() {
  document.getElementById('btnLogin').addEventListener('click', loginUser, false);
  document.getElementById('btnReg').addEventListener('click', createAccount, false);
  document.getElementById('btnLogout').addEventListener('click', signOut, false);
  document.getElementById('btnSaveProfile').addEventListener('click', saveProfile, false);
  document.getElementById('btnSaveAppearance').addEventListener('click', saveAppearance, false);
  document.getElementById('btnEditProfile').addEventListener('click', editProfile, false);
  document.getElementById('btnBackToMessage').addEventListener('click', backToMessage, false);
  document.getElementById('btnMsgSend').addEventListener('click', sendMessage, false);
  document.getElementById('btnEmoji').addEventListener('click', addEmoji, false);
  let sRadio = document.querySelectorAll('.styleRadio');
  for (let i = 0; i < sRadio.length; i++) {
    sRadio[i].addEventListener('click', function () {
      applyStyle(this.value);
      console.log(this.value);
      
    });
  }
  document.getElementById('msgInput').addEventListener("keyup", function (event) {
    // Cancel the default action, if needed
    event.preventDefault();
    // Number 13 is the "Enter" key on the keyboard
    if (event.keyCode === 13) {
      sendMessage();
    }
    if (this.value != '' && auth.currentUser) {
      enable('#btnMsgSend');
    } else {
      disable('#btnMsgSend');
      disable('#btnEmoji');
    }
  });
  document.getElementById('txtEmail').addEventListener("keyup", function (event) {
    event.preventDefault();
    // Number 13 is the "Enter" key on the keyboard
    if (event.keyCode === 13) {
      loginUser();
    }
  });
  document.getElementById('txtPassword').addEventListener("keyup", function (event) {
    event.preventDefault();
    // Number 13 is the "Enter" key on the keyboard
    if (event.keyCode === 13) {
      loginUser();
    }
  });
  auth.onAuthStateChanged(function (user) {
    if (user) {
      currentUser = auth.currentUser;
      showElementInline('currentUserDiv');
      hideElement('login');
      showElement('onlineUsersDiv');
      document.getElementById('currentUser').innerHTML = user.email;

      firebase.database().ref('/users/' + currentUser.uid).once('value').then(
        function (snapshot) {
          if (snapshot.val().type == "admin") {
            showElement("adminPanel");
          }
        }
      );

    } else {
      showElementInline('login');
      hideElement('currentUserDiv');
      hideElement('onlineUsersDiv');
      hideElement('adminPanel');
    }
  });
  getMessages("Main");
  getOnlineUsers();
}

function createAccount() {
  var email = document.querySelector('#txtEmail').value;
  var password = document.querySelector('#txtPassword').value;
  auth.createUserWithEmailAndPassword(email, password).catch(function (error) {
    // Handle Errors here.
    var errorCode = error.code;
    var errorMessage = error.message;
    alert("Error Code: " + errorCode + "\nError Message: " + errorMessage);
  }).then(function () {
    setTimeout(function () {
      var userObj = {
        uid: currentUser.uid,
        email: email,
        type: "user",
        userName: "Anonymous"
      };
      base.ref('users').child(currentUser.uid).set(userObj).then(function (error) {
        if (error) {
          console.error(error);
        } else {
          console.log("Account created");
          alert("Account Created", '', 'Success');
        }
      });
    }, 10);
  });
}

function loginUser() {
  var email = document.querySelector('#txtEmail').value;
  var password = document.querySelector('#txtPassword').value;
  auth.signInWithEmailAndPassword(email, password)
    //On Success
    .then(function () {
        console.log("Login Successful");
        currentUser = auth.currentUser;
        base.ref('users/' + currentUser.uid).once('value').then(function (snapshot) {
          base.ref('onlineUsers/' + currentUser.uid).set(snapshot.val().userName).then(function (err) {
            if (err) {
              console.error(err);
            } else {
              console.log("User now online");
              if (auth.currentUser) {
                document.querySelector('#msgContainer').innerHTML = '';
                getMessages("Main");
                cleanMessages(currentUser.uid);
                setStyles();
                enable('#btnEmoji');
              }
            }
          });
        });



      },
      //On Error
      function (error) {
        if (error.code === 'auth/wrong-password') {
          console.log("Wrong PassWord");
        }
        if (error.code === 'auth/user-not-found') {
          console.log("User Not Found");
        }
      });

}

function signOut() {
  auth.signOut().then(function () {
    console.log("Signed Out");
    base.ref('onlineUsers').child(currentUser.uid).remove().then(function (error) {
      if (error) {
        console.error(error);
      }
    });
    clearTabs();
    setStyles();
  }).catch(function (error) {
    console.log(error);
  });
}

function editProfile() {
  showElement('profile');
  hideElement('messaging');
  showElement('btnBackToMessage');
  hideElement('btnEditProfile');
  firebase.database().ref('/users/' + currentUser.uid).once('value').then(
    function (snapshot) {
      document.getElementById('firstName').value = snapshot.val().firstName;
      document.getElementById('lastName').value = snapshot.val().lastName;
      document.getElementById('userName').value = snapshot.val().userName;
    }
  );
}

function saveProfile() {
  var user = auth.currentUser;
  var userID = user.uid;
  base.ref('users').child(userID).update({
    firstName: document.querySelector('#firstName').value,
    lastName: document.querySelector('#lastName').value,
    userName: document.querySelector('#userName').value
  }).then(
    function (error) {
      if (error) {
        console.error(error);
      } else {
        console.log("Profile Updated");
        alert("Profile updated", '', 'Success');
      }
    }
  );
}

function saveAppearance() {
  var user = auth.currentUser;
  var userID = user.uid;

  base.ref('users').child(userID).update({
    theme: document.querySelector('input[name="radioTheme"]:checked').value,
    colour: document.querySelector('input[name="radioColour"]:checked').value
  }).then(
    function (error) {
      if (error) {
        console.error(error);
      } else {
        setTimeout(function(){setStyles();},100);
        console.log("Appearance Updated");
      }
    }
  );
}

function setStyles() {
  let btns = document.querySelectorAll('.btn');
  let u;
  if (auth.currentUser) {
    base.ref('users').child(currentUser.uid).once('value').then(function (snapshot) {
      u = snapshot.val();
      
    });
    switch (u.colour) {
      case 'blue':
        document.body.style.backgroundColor = blue;
        for (var i = 0; i < btns.length; i++) {
          btns[i].style.backgroundColor = blue + '7F';
          if (u.theme = 'dark') {
            btns[i].style.backgroundColor = blue;
          }
        }
        break;
      case 'orange':
        document.body.style.backgroundColor = orange;
        for (var i = 0; i < btns.length; i++) {
          btns[i].style.backgroundColor = orange + '7F';
          if (u.theme = 'dark') {
            btns[i].style.backgroundColor = orange;
          }
        }
        break;
      case 'pink':
        document.body.style.backgroundColor = pink;
        for (var i = 0; i < btns.length; i++) {
          btns[i].style.backgroundColor = pink + '7F';
          if (u.theme = 'dark') {
            btns[i].style.backgroundColor = pink;
          }
        }
        break;
      default:
        break;
    }
    if (u.theme == 'dark') {
      document.getElementById("pagestyle").setAttribute("href", 'dark.css');
    } else {
      document.getElementById("pagestyle").setAttribute("href", 'style.css');
    }
  } else {
    document.body.style.backgroundColor = blue;
    for (var i = 0; i < btns.length; i++) {
      btns[i].style.backgroundColor = blue + '7F';
      if (u.theme = 'dark') {
        btns[i].style.backgroundColor = blue;
      }

    }
  }
}

function applyStyle(style) {
  let btns = document.querySelectorAll('.btn');
  let styleSheet = document.getElementById("pagestyle")
  switch (style) {
    case 'dark':
      styleSheet.setAttribute("href", 'dark.css');
      break;
    case 'light':
      styleSheet.setAttribute("href", 'style.css');
      break;
    case 'blue':
      document.body.style.backgroundColor = blue;
      for (var i = 0; i < btns.length; i++) {
        btns[i].style.backgroundColor = blue + '7F';
        if (styleSheet.href == 'dark.css') {
          btns[i].style.backgroundColor = blue;
        }
      }
      break;
    case 'orange':
      document.body.style.backgroundColor = orange;
      for (var i = 0; i < btns.length; i++) {
        btns[i].style.backgroundColor = orange + '7F';
        if (styleSheet.href == 'dark.css') {
          btns[i].style.backgroundColor = orange;
        }
      }
      break;
    case 'pink':
      document.body.style.backgroundColor = pink;
      for (var i = 0; i < btns.length; i++) {
        btns[i].style.backgroundColor == pink + '7F';
        if (styleSheet.href = 'dark.css') {
          btns[i].style.backgroundColor = pink;
        }
      }
      break;
    default:
      break;
  }
}

function showElement(toShow) {
  document.getElementById(toShow).classList.add('show');
  document.getElementById(toShow).classList.remove('hide');
}

function showElementInline(toShow) {
  document.getElementById(toShow).classList.add('showInline');
  document.getElementById(toShow).classList.remove('hide');
}

function hideElement(toHide) {
  if (document.getElementById(toHide)) {
    document.getElementById(toHide).classList.add('hide');
  }
  if (document.getElementById(toHide)) {
    document.getElementById(toHide).classList.remove('show');
    document.getElementById(toHide).classList.remove('showInline');
  }
}

function backToMessage() {
  showElement('btnEditProfile');
  hideElement('btnBackToMessage');
  showElement('messaging');
  hideElement('profile');
}

function getOnlineUsers() {
  var onlineUsersDiv = document.getElementById("onlineUsersDiv");
  onlineUsersDiv.innerHTML = '';
  var users = base.ref("onlineUsers");
  users.on('child_added', function (childSnapshot) {
    console.log(childSnapshot.val());
    var u = document.createElement("b");
    u.textContent = childSnapshot.val();
    var uElement = document.createElement("div");
    uElement.appendChild(u);
    document.getElementById("onlineUsersDiv").appendChild(uElement);
  });
}

function sendMessage() {
  var input = document.querySelector('#msgInput');
  if (auth.currentUser) {
    if (input != '') {
      var now = new Date();
      var messageObj = {
        message: input.value,
        timestamp: now.toString(),
        user: auth.currentUser.uid,
      };
      var convoList = document.getElementsByClassName('convo');
      var convo;
      for (var i = 0; i < convoList.length; i++) {
        if (convoList[i].style.display == 'block') {
          convo = convoList[i].id.slice(7);
        }
      }
      base.ref('conversations/' + convo + '/messages/').push(messageObj, function () {
        console.log("Message Sent!");
      });
      //Clear input box
      input.value = '';
    } else {
      alert("Please enter a message to send");
    }
  } else {
    alert("Please log in to send messages");
  }

}

function getMessages(convo) {
  if (!document.getElementById('msgFeed' + convo)) {
    var newConvo = document.createElement('div');
    newConvo.id = "msgFeed" + convo;
    newConvo.classList.add('convo');
  } else {
    var newConvo = document.getElementById("msgFeed" + convo)
  }
  var messages = base.ref("conversations/" + convo + '/messages/');
  messages.on('child_added', function (snapshot) {
    document.getElementById('beep').play();

    var msg = snapshot.val();
    var test = msg.message;
    var msgUsernameElement = document.createElement("b");
    msgUsernameElement.style.cursor = "pointer";
    base.ref('/users/' + msg.user).once('value').then(function (snapshot) {
      msgUsernameElement.textContent = "User: " + snapshot.child('userName').val();
      msgUsernameElement.addEventListener('click', function () {
        privateMessage(msg.user);
      });
    });

    var msgTextElement = document.createElement("p");
    msgTextElement.textContent = msg.message;
    var msgElement = document.createElement("div");
    var msgDelete = document.createElement("div");

    msgElement.id = "msg" + snapshot.key;
    msgDelete.textContent = "DELETE";
    msgDelete.style.color = "red";
    msgDelete.style.cursor = "pointer";
    msgElement.classList.add('message');
    msgDelete.addEventListener('click', function () {
      deleteMessage(snapshot.key, convo);
    });
    msgElement.appendChild(msgUsernameElement);
    msgElement.appendChild(msgTextElement);
    if (auth.currentUser) {
      firebase.database().ref('/users/' + currentUser.uid).once('value').then(function (snapshot) {
        if (snapshot.val().type == 'admin') {
          msgElement.appendChild(msgDelete);
          console.log("Admin logged in");
        }
      });
    }
    if (auth.currentUser) {
      if (msg.user == currentUser.uid) {
        msgElement.classList.add('ownMessage');
      }
    }
    newConvo.appendChild(msgElement);
    document.querySelector('#msgContainer').appendChild(newConvo);
    openTab(convo);
  });
}

function getConvos() {
  convos = [];
  var to;

  base.ref('/users/' + currentUser.uid + '/conversations/').once('value').then(function (snapshot) {
    var i = 0;
    snapshot.forEach(function (child) {
      var key = child.key;
      convos[i] = key;
      base.ref('conversations/' + key + '/users/').once('value').then(function (snapshot) {
        var users = snapshot.val();
        var toID;
        if (users) {
          for (var i = 0; i < users.length; i++) {
            if (users[i] != auth.currentUser.uid) {
              toID = users[i];
            }
          }
        }

        base.ref('/users/' + toID).once('value').then(function (snap) {
          to = snap.child('userName').val();

          //creating the tab box
          if (!document.querySelector('#tabBox' + key)) {
            var tabBox = document.createElement('div');
            tabBox.classList.add('tabBox');
            tabBox.classList.add('inactive');
            tabBox.innerHTML = to;
            tabBox.id = "tabBox" + key;

            //creating the tab to go in the tab box
            var tab = document.createElement('div');
            tab.classList.add('tab');
            tab.id = "tab" + key;
            tabBox.addEventListener('click', function () {
              openTab(key);
            });
            document.getElementById('tabs').appendChild(tab);

            //append the tab to the tabBox
            tab.appendChild(tabBox);
          }
        });
      });
      i++;
    });
  });
}

function deleteMessage(msgID, convo) {
  if (confirm('Are you sure you want to delete this message?')) {
    base.ref('conversations/' + convo + '/messages/').child(msgID).remove();
    console.log("Message deleted");
    var msgElement = document.getElementById('msg' + msgID);
    msgElement.parentNode.removeChild(msgElement);
  }
}

function cleanMessages(uid) {
  var keys, convos, userConvos;
  //get keys of user's conversations
  base.ref('users/' + uid + '/conversations').once('value').then(function (snapshot) {
    keys = Object.keys(snapshot.val());
  });
  //get all conversations
  base.ref('conversations').once('value').then(function (snapshot) {
    convos = snapshot.val();
    //loop through keys of user convos to find matches in the main convo list
    for (let i = 0; i < keys.length; i++) {
      // loop through all convos
      for (var key in convos) {
        var convo = convos[key];
        //if they match check for messages
        if (keys[i] == key) {
          if (!convo.messages) {
            base.ref('conversations/' + key).remove();
            base.ref('users/' + uid + '/conversations/' + key).remove();
          }
        }
      }
    }
  });
  setTimeout(function () {
    getConvos();
  }, 100);
}

function privateMessage(to) {
  var key;
  if (auth.currentUser) {
    var now = new Date();
    var convoObj = {
      users: [auth.currentUser.uid, to],
      timestamp: now.toString(),
    };
    base.ref('users/' + auth.currentUser.uid + '/conversations/').once('value').then(function (snapshot) {
      snapshot.forEach(function (childSnapshot) {
        var users = childSnapshot.val().users;
        users.forEach(function (u) {
          if (u == to) {};
        })
      });
    });
    base.ref('conversations/').push(convoObj, function () {}).then(function (snapshot) {
      base.ref('users/' + currentUser.uid + '/conversations/' + snapshot.key).set({
        id: snapshot.key,
        users: [auth.currentUser.uid, to]
      });
      base.ref('users/' + to + '/conversations/' + snapshot.key).set({
        id: snapshot.key,
        users: [auth.currentUser.uid, to]
      });
      document.querySelector('#msgInput').value = '';
      var newConvo = document.createElement('div');
      newConvo.id = "msgFeed" + snapshot.key;
      newConvo.classList.add('convo');
      document.querySelector('#msgContainer').appendChild(newConvo);
      getConvos();
      getMessages(snapshot.key);
    });
  } else {
    alert("Please log in to private message");
  }
}

function openTab(convo) {
  var i;
  var x = document.getElementsByClassName("convo");
  for (i = 0; i < x.length; i++) {
    x[i].style.display = "none";
  }
  if (!document.getElementById('msgFeed' + convo)) {
    getMessages(convo);
  } else {
    document.getElementById('msgFeed' + convo).style.display = "block";
    switchTab(convo);
  }
}

//function to switch tabs
function switchTab(convo) {
  var x = document.getElementsByClassName("tab");
  for (i = 0; i < x.length; i++) {
    x[i].classList.remove("active");
    x[i].classList.add('inactive');
  }
  document.getElementById('tab' + convo).classList.add('active');
  document.getElementById('tab' + convo).classList.remove('inactive');
}

function clearTabs() {
  let tabs = document.querySelectorAll('.tab');
  for (var i = 0; i < tabs.length; i++) {
    var tab = tabs[i];
    if (tab.id != 'tabMain') {
      tab.parentElement.removeChild(tab);
      tab = null;
    }
  }
}

// emoji
function addEmoji() {
  var x = document.getElementById("pickEmoji");
  if (x.style.display === "none") {
    x.style.display = "block";
  } else {
    x.style.display = "none";
  }
}

function insertSmiley(smiley) {
  var currentText = document.getElementById("msgInput");
  var smileyWithPadding = " " + smiley + " ";
  currentText.value += smileyWithPadding;
  currentText.focus();
}

function saveVolume() {

}

function setVolume() {
  let x = document.getElementById("beep");
  base.ref('users').child(currentUser.uid).once('value').then(function (snapshot) {
    x.volume = snapshot.val().volume;
  });
}

function enable(element) {
  document.querySelector(element).disabled = false;
}

function disable(element) {
  document.querySelector(element).disabled = true;
}