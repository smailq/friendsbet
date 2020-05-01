import Vue from 'vue';
import App from './App.vue';
import LoggedIn from './LoggedIn.vue';

Vue.config.productionTip = false;

let vm;

// eslint-disable-next-line no-undef
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


