<template>
  <div id="app" class="login-page">
    <h1>FriendsBet</h1>
    <p>Daily habit builder. Send proof of your daily habit updates to your friends, every day.
      If you miss a day, your credit card will be charged with a penalty fee of $5.
      At the end of the set time(may be 1~3 months?), collected penalty fee from everyone is awarded to whoever has
      highest attendance. Divided to people if there is a
      tie.</p>
    <button @click="login">Log in</button>
  </div>
</template>

<script>
  export default {
    name: 'App',
    methods: {
      login() {
        // eslint-disable-next-line no-undef
        const provider = new firebase.auth.GoogleAuthProvider();
        // eslint-disable-next-line no-undef
        firebase.auth().signInWithPopup(provider).then(function(result) {
          console.log(result);
        }).catch(function(error) {
          const errorCode = error.code;
          const errorMessage = error.message;
          const email = error.email;
          const credential = error.credential;
          console.log(errorCode, errorMessage, email, credential);
        });
      },
    },
  };
</script>

<style scoped>
  .login-page {
    max-width: 600px;
    margin: 0 auto;
  }
</style>
