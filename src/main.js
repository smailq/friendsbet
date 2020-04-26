// This import loads the firebase namespace along with all its type information.
import * as firebase from 'firebase/app';

// These imports load individual services into the firebase namespace.
import 'firebase/auth';

import Vue from 'vue';
import App from './App.vue';
import LoggedIn from './LoggedIn.vue';

if (typeof firebase === 'undefined') throw new Error(
    'hosting/init-error: Firebase SDK not detected. You must include it before /__/firebase/init.js');

firebase.initializeApp({
  'apiKey': 'AIzaSyD79sLF6O-7Is3Gy0E-ULmj_c_oPhK1dGY',
  'appId': '1:900298371313:web:7045c431c17340f0f7f950',
  'authDomain': 'friendsbet-1bcc0.firebaseapp.com',
  'databaseURL': 'https://friendsbet-1bcc0.firebaseio.com',
  'measurementId': 'G-EVZYG9DFM1',
  'messagingSenderId': '900298371313',
  'projectId': 'friendsbet-1bcc0',
  'storageBucket': 'friendsbet-1bcc0.appspot.com',
});

Vue.config.productionTip = false;

let vm;

firebase.auth().onAuthStateChanged(user => {

  // Clean up if app loaded before.
  if (vm) {
    vm.$destroy();
    document.getElementById('app').innerHTML = '';
  }

  if (user) {
    // this.user.loggedIn = true;
    // this.user.data = user;
    vm = new Vue({
      data: {
        user: user,
      },
      render: h => h(LoggedIn),
    }).$mount('#app');
  } else {
    vm = new Vue({
      render: h => h(App),
    }).$mount('#app');
  }
});


