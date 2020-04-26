<template>
  <div id="app">
    You are logged in. as {{ $root.$data.user.email }}
    {{ $root.$data.user.displayName }}

    <button @click="logout">Logout</button>
  </div>
</template>

<script>
  import * as firebase from 'firebase/app';

  import 'firebase/auth';


  export default {
    name: 'LoggedIn',

    methods: {
      logout() {
        firebase.auth().signOut()
        .then(function() {})
        .catch(function(error) {
          console.log(error)});
      }
    }
  };
</script>

<style scoped>

</style>
