<template>
  <div id="app">
    <button @click="login">Log in</button>
  </div>
</template>

<script>

  import * as firebase from 'firebase/app';

  import 'firebase/auth';

  export default {
    name: 'App',
    methods: {
      login() {
        const provider = new firebase.auth.GoogleAuthProvider();
        firebase.auth().signInWithPopup(provider).then(function(result) {
          console.log(result);
        }).catch(function(error) {
          const errorCode = error.code;
          const errorMessage = error.message;
          const email = error.email;
          const credential = error.credential;
          console.log(errorCode, errorMessage, email, credential);
        });
      }
    }
  };
</script>

<style>

</style>
