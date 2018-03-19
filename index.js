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
var storage = firebase.storage();
var storageRef = storage.ref();
var msgCount;
var convos = [];

window.addEventListener("DOMContentLoaded", onDeviceReady, false);
window.onbeforeunload = function(event) {
  // do stuff here
  signOut();
};


function onDeviceReady() {
  document.getElementById('btnLogin').addEventListener('click', loginUser, false);
  document.getElementById('btnReg').addEventListener('click', createAccount, false);
  document.getElementById('btnLogout').addEventListener('click', signOut, false);
  document.getElementById('btnSaveProfile').addEventListener('click', saveProfile, false);
  document.getElementById('btnEditProfile').addEventListener('click', editProfile, false);
  document.getElementById('btnBackToMessage').addEventListener('click', backToMessage, false);
  document.getElementById('btnMsgSend').addEventListener('click', sendMessage, false);
  document.getElementById('btnEmoji').addEventListener('click', addEmoji, false);
  document.getElementById('msgInput').addEventListener("keyup", function(event) {
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
    }
  });
  auth.onAuthStateChanged(function(user) {
    if (user) {
      currentUser = auth.currentUser;
      showElement('currentUserDiv');
      hideElement('login');
      showElement('onlineUsersDiv');
      document.getElementById('currentUser').innerHTML = user.email;

      firebase.database().ref('/users/' + currentUser.uid).once('value').then(
        function(snapshot) {
          if (snapshot.val().type == "admin") {
            showElement("adminPanel");
          }
        }
      );

    } else {
      showElement('login');
      hideElement('currentUserDiv');
      hideElement('onlineUsersDiv');
      hideElement('adminPanel');
    }
  });
  getOnlineUsers();
  getMessages("Main");
}

function createAccount() {
  var email = document.querySelector('#txtEmail').value;
  var password = document.querySelector('#txtPassword').value;
  auth.createUserWithEmailAndPassword(email, password).catch(function(error) {
    // Handle Errors here.
    var errorCode = error.code;
    var errorMessage = error.message;
    alert("Error Code: " + errorCode + "\nError Message: " + errorMessage);
  }).then(function() {
    setTimeout(function() {
      var userObj = {
        uid: currentUser.uid,
        email: email,
        type: "user",
        online: true,
        userName: "Anonymous"
      };
      base.ref('users').child(currentUser.uid).set(userObj).then(function(error) {
        if (error) {
          console.error(error);
        } else {
          console.log("Account created");
          getOnlineUsers();
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
    .then(function() {
        console.log("Login Successful");
        currentUser = auth.currentUser;
        base.ref('users').child(currentUser.uid).update({
          online: true
        }).then(function(err) {
          if (err) {
            console.error(err);
          } else {
            getOnlineUsers();
            console.log("User now online");
            if (auth.currentUser) {
              document.querySelector('#msgContainer').innerHTML = '';
              getMessages("Main");
              getConvos();
            }
          }
        });
      },
      function(error) {
        if (error.code === 'auth/wrong-password') {
          console.log("Wrong PassWord");
        }
        if (error.code === 'auth/user-not-found') {
          console.log("User Not Found");
        }
      });
}

function signOut() {
  base.ref('users').child(currentUser.uid).update({
    online: false
  }).then(function(error) {
    getOnlineUsers();
    if (error) {
      console.error(error);
    }
  });
  auth.signOut().then(function() {
    console.log("Signed Out");
  }).catch(function(error) {
    console.log(error);
    base.ref('users').child(currentUser.uid).update({
      online: true
    }).then(function(error) {
      if (error) {
        console.error(error);
      } else {
        // setTimeout(function(){ getOnlineUsers(); }, 1000);
        getOnlineUsers();
        console.log("User now offline");
      }
    });
  });
}

function editProfile() {
  showElement('profile');
  hideElement('messaging');
  showElement('btnBackToMessage');
  hideElement('btnEditProfile');
  firebase.database().ref('/users/' + currentUser.uid).once('value').then(
    function(snapshot) {
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
    function(error) {
      if (error) {
        console.error(error);
      } else {
        console.log("Profile Updated");
        alert("Profile updated", '', 'Success');
        showElement('messaging');
        hideElement('profile');
      }
    }
  );
}

function showElement(toShow) {
  document.getElementById(toShow).classList.add('show');
  document.getElementById(toShow).classList.remove('hide');
}

function hideElement(toHide) {
  document.getElementById(toHide).classList.add('hide');
  document.getElementById(toHide).classList.remove('show');
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
  var users = base.ref("users");
  users.on('value', function(snapshot) {
    snapshot.forEach(function(childSnapshot) {
      var user = childSnapshot.val();
      if (user.online) {
        var u = document.createElement("b");
        u.textContent = user.userName;
        var uElement = document.createElement("div");
        uElement.appendChild(u);
        document.getElementById("onlineUsersDiv").appendChild(uElement);
      }
    });
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
      console.log(convoList);
      for (var i = 0; i < convoList.length; i++) {
        if (convoList[i].style.display == 'block') {
          convo = convoList[i].id.slice(7);
          console.log(convo);
        }
      }
base.ref('conversations/' + convo + '/messages/').push(messageObj, function() {
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
  msgCount = 0;
  messages.on('child_added', function(snapshot) {
    document.getElementById('beep').play();

    var msg = snapshot.val();
    var test = msg.message;
    var msgUsernameElement = document.createElement("b");
    msgUsernameElement.style.cursor = "pointer";
    firebase.database().ref('/users/' + msg.user).once('value').then(function(snapshot) {
      msgUsernameElement.textContent = "User: " + snapshot.val().userName;
      msgUsernameElement.addEventListener('click', function() {
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
    msgDelete.addEventListener('click', function() {
      deleteMessage(snapshot.key);
    });
    msgElement.appendChild(msgUsernameElement);
    msgElement.appendChild(msgTextElement);
    if (auth.currentUser) {
      firebase.database().ref('/users/' + currentUser.uid).once('value').then(function(snapshot) {
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
    scrollToBottom('msgContainer');
    openTab(convo);
  });
}

function getConvos() {
  convos = [];
  base.ref('/users/' + currentUser.uid + '/conversations/').once('value').then(function(snapshot) {
    var i = 0;
    snapshot.forEach(function(child){
        var key = child.key;
        convos[i] = key;
        var x = child.val().id;
        var to;
        base.ref('conversations/' + x + '/users/').once('value').then(function(snapshot) {
            var users = snapshot.val();
            for (var i = 0; i < users.length; i++) {
              if (users[i] != auth.currentUser.uid)
              console.log(users[i]);
              to = users[i];
            }
            base.ref('/users/' + to).once('value').then(function(snapshot2){
              to = snapshot2.val().userName;
            });
        });
        //Build DOM
        //<button class="w3-bar-item w3-button" onclick="openTab('Main')">Main</button>
        var btn = document.createElement('button');
        btn.classList.add('w3-bar-item', 'w3-button');
        btn.style.width = '20%';
        btn.style.overflow = 'hidden';
        btn.style.height = '25px';
        btn.addEventListener('click', function(){ openTab(key);});
        btn.innerHTML = to;

        document.getElementById('tabs').appendChild(btn);

        i++;
    });
  });
}

function deleteMessage(msgID) {
  if (confirm('Are you sure you want to delete this message?')) {
    base.ref('conversations/' + convo + '/messages/').child(msgID).remove();
    console.log("Message deleted");
    var msgElement = document.getElementById('msg' + msgID);
    msgElement.parentNode.removeChild(msgElement);
  }
}

function privateMessage(to) {
  var key;
  if (auth.currentUser) {
    var now = new Date();
    var convoObj = {
      users: [auth.currentUser.uid, to],
      timestamp: now.toString(),
    };
    base.ref('conversations/').push(convoObj, function() {}).then(function(snapshot) {
      base.ref('users/' + currentUser.uid + '/conversations/' + snapshot.key).set({
        id: snapshot.key
      });
      base.ref('users/' + to + '/conversations/' + snapshot.key).set({
        id: snapshot.key
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
  }
  document.getElementById('msgFeed' + convo).style.display = "block";
  scrollToBottom('msgContainer');
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
function insertSmiley(smiley){

  var currentText = document.getElementById("msgInput");

  var smileyWithPadding = " " + smiley + " ";
  currentText.value += smileyWithPadding;
  currentText.focus();
}

function PlaySound(soundObj) {
  var sound = document.getElementById(soundObj);
  sound.play();
}

function scrollToBottom(id) {
  var div = document.getElementById(id);
  div.scrollTop = div.scrollHeight - div.clientHeight;
}
function enable(element) {
  document.querySelector(element).disabled = false;
}
function disable(element) {
  document.querySelector(element).disabled = true;
}
