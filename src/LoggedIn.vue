<template>
  <div id="app" class="loggedin-page">
    <div>
      <b>FriendsBet</b>
      <p>
        You are logged in as <b>{{ $root.$data.user.displayName }}</b> ({{ $root.$data.user.email }})<span
          style="font-size:0.8em;" v-if="cardSummary"> with {{cardSummary}}</span>
        <button style="margin-left:2em;" @click="logout">Logout</button>
      </p>
    </div>

    <div class="creditcard-message" v-if="pendingCardAdd === false && hasCard === false">
      You need to setup credit card to join any group. <a href="/add-card">Add card</a>
    </div>

    <div v-if="pendingCardAdd" class="creditcard-message">
      Your card is being processed and added. Please wait ...
    </div>

    <div v-if="hasCard">
      <h3>Join bet</h3>
      <input v-model="joinBet" type="text">
      <button @click="join">join</button>
    </div>

    <div>
      <h3>
        Ongoing Bets
      </h3>
      <ul v-if="betList.length > 0">
        <li :key="bet.name" v-for="bet in betList">{{ bet.name }}</li>
      </ul>
      <p v-else>
        no bets made
      </p>
    </div>
  </div>
</template>

<script>
  export default {
    name: 'LoggedIn',
    data() {
      return {
        pendingCardAdd: undefined,
        hasCard: undefined,
        addingUnsubs: undefined,
        stripeUnsubs: undefined,
        cardSummary: undefined,
        joinBet: '',
        betList: [],
      };
    },
    beforeDestroy() {
      if (this.addingUnsubs) {
        this.addingUnsubs();
      }
      if (this.stripeUnsubs) {
        this.stripeUnsubs();
      }
    },
    mounted() {

      // eslint-disable-next-line no-undef
      firebase.firestore().
          collection('bets').
          where('members', 'array-contains', this.$root.$data.user.uid).
          onSnapshot(snapshot => {
            const betlist = [];
            snapshot.forEach(result => {
              betlist.push(result.data());
            });
            this.betList = betlist;
          });

      // eslint-disable-next-line no-undef
      this.stripeUnsubs = firebase.firestore().
          collection('stripe_customers').
          doc(this.$root.$data.user.uid).
          collection('sources').
          onSnapshot(snapshot => {
            if (snapshot.size > 0) {
              this.hasCard = true;

              snapshot.forEach(qs => {
                this.cardSummary = `${qs.get('funding')} ${qs.get('brand')} ending ${qs.get('last4')}`;
              });
              if (this.stripeUnsubs) {
                this.stripeUnsubs();
              }
            } else {
              this.hasCard = false;
            }
          });

      // eslint-disable-next-line no-undef
      this.addingUnsubs = firebase.firestore().
          collection(`stripe_customers/${this.$root.$data.user.uid}/tokens`).
          onSnapshot(snapshot => {
            if (snapshot.size > 0) {
              this.pendingCardAdd = true;
            } else {
              this.pendingCardAdd = false;
              if (this.addingUnsubs) {
                this.addingUnsubs();
              }
            }
          });

    },
    methods: {
      join() {
        // eslint-disable-next-line no-undef
        firebase.functions().httpsCallable('joinBet')({
          betId: this.joinBet,
        }).catch(error => {
          console.error(error);
          alert(error.message);
        });

        this.joinBet = '';
      },
      logout() {
        // eslint-disable-next-line no-undef
        firebase.auth().signOut().then(function() {
        }).catch(function(error) {
          console.log(error);
        });
      },
    },
  };
</script>

<style scoped>
  .loggedin-page {
    max-width: 600px;
    margin: 0 auto;
  }

  .creditcard-message {
    margin: 1em 0;
    padding: 1em;
    background-color: #E1F5FE;
    border-radius: 10px;
  }
</style>
