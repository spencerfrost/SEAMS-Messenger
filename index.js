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

window.addEventListener("DOMContentLoaded", onDeviceReady, false);


function onDeviceReady () {
  document.getElementById('btnLogin').addEventListener('click', loginUser, false);
  document.getElementById('btnSignUp').addEventListener('click', createAccount, false);
  document.getElementById('btnLogout').addEventListener('click', signOut, false);
  document.getElementById('btnSaveProfile').addEventListener('click', saveProfile, false);
  auth.onAuthStateChanged(function(user) {
    if (user) {
      currentUser = user;
      userDiv.innerHTML = user.email;
    } else {
      userDiv.innerHTML = 'No user is signed in';
    }
  });
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
    console.log("Login Successful");
  });
}

function loginUser() {
  var email = document.querySelector('#txtEmail').value;
  var password = document.querySelector('#txtPassword').value;
  auth.signInWithEmailAndPassword(email, password)
    .then(function() {
      console.log("Login Successful");
      currentUser = auth.currentUser;
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
  auth.signOut().then(function() {
    console.log("Signed Out");
  }).catch(function(error) {
    console.log(error);
  });
}

function saveProfile() {

  var user = auth.currentUser;

  var userObj = {
    firstName: document.querySelector('#firstName').value,
    lastName: document.querySelector('#lastName').value,
    userName: document.querySelector('#userName').value
  };
  var userID = user.uid;

  base.ref('users').child(userID).set(userObj).then(function(error) {
    if (error) {
      console.error(error);
    } else {
      console.log("Profile Updated");
      alert("Profile updated", '', 'Success');
    }
  });
}
