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
      currentUser = user;
      showElement('currentUserDiv');
      hideElement('login');
      showElement('onlineUsersDiv');
      document.getElementById('currentUser').innerHTML = user.email;
    } else {
      showElement('login');
      hideElement('currentUserDiv');
      hideElement('onlineUsersDiv');
    }
  });
  getOnlineUsers();
  getMessages();
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
      }).then(function(error) {
        if (error) {
          console.error(error);
        } else {
          getOnlineUsers();
          console.log("User now online");
        }
      });
    }, function(error) {
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


  // users.on('child_changed', function(snapshot) {
  //   var msg = snapshot.val();
  //   var test = msg.message;
  //   var msgUsernameElement = document.createElement("b");
  //   firebase.database().ref('/users/' + msg.user).once('value').then(function(snapshot) {
  //     msgUsernameElement.textContent = "User: " + snapshot.val().userName;
  //   });
  //   var msgElement = document.createElement("div");
  //   msgElement.appendChild(msgUsernameElement);
  //   msgElement.classList.add('message');
  //   if (msg.user == currentUser.uid) {
  //     msgElement.classList.add('ownMessage');
  //   }
  //   document.getElementById("msgFeed").appendChild(msgElement);
  // });



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
      var messageID = now;
      base.ref('messages').push(messageObj, function(){
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

function getMessages() {
  var messages = base.ref("messages");
  msgCount = 0;
  messages.on('child_added', function(snapshot) {
    var sound = document.getElementById('beep');
    sound.play();
    var msg = snapshot.val();
    var test = msg.message;
    var msgUsernameElement = document.createElement("b");
    firebase.database().ref('/users/' + msg.user).once('value').then(function(snapshot) {
      msgUsernameElement.textContent = "User: " + snapshot.val().userName;
    });
    var msgTextElement = document.createElement("p");
    msgTextElement.textContent = msg.message;
    var msgElement = document.createElement("div");
    msgElement.appendChild(msgUsernameElement);
    msgElement.appendChild(msgTextElement);
    msgElement.classList.add('message');
    if(auth.currentUser){
      if (msg.user == currentUser.uid) {
        msgElement.classList.add('ownMessage');
      }
    }
    document.getElementById("msgFeed").appendChild(msgElement);
    msgCount++;
    scrollToBottom('msgContainer');
  });
}

function PlaySound(soundObj) {
  var sound = document.getElementById(soundObj);
  sound.play();
}

function scrollToBottom (id) {
   var div = document.getElementById(id);
   div.scrollTop = div.scrollHeight - div.clientHeight;
}

function enable(element){
  document.querySelector(element).disabled = false;
}
function disable(element){
  document.querySelector(element).disabled = true;
}
