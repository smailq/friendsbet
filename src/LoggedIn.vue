<template>
  <div id="app" class="loggedin-page">
    <div class="top-menu">
      <div>
        <b>FriendsBet</b>
        <div>
          <small>{{ $root.$data.user.email }}</small>
          <small v-if="cardSummary"> with {{cardSummary}}</small>
        </div>
      </div>
      <button @click="logout">Logout</button>
    </div>

    <div class="creditcard-message" v-if="pendingCardAdd === false && hasCard === false">
      You need to setup credit card to join any group. <a href="/add-card">Add card</a>
    </div>

    <div v-if="pendingCardAdd" class="creditcard-message">
      Your card is being processed and added. Please wait ...
    </div>

    <div v-if="hasCard && betList.length < 1">
      <h3>Join bet</h3>
      <input v-model="joinBet" type="text">
      <button @click="join">join</button>
    </div>

    <div class="bet-list" v-if="betList.length > 0">
      <div :key="bet.name" v-for="bet in betList">
        <a @click="selectedBet = bet">{{ bet.name }}</a>
      </div>
    </div>
    <p v-else>
      no bets made
    </p>

    <div v-if="selectedBet.id">
      <div class="heading">
        <h1>{{ selectedBet.name }}</h1>
        <p>
          <label>Upload update: </label>
          <input type="file" name="fileToUpload" ref="file" @change="handleFileUpload($event.target.files)">
        </p>
      </div>
      <div class="stats">
        <a @click="showStats = !showStats">Toggle Stats</a>
      </div>
      <dl v-if="showStats">
        <dt>Current Leader</dt>
        <dd>Kyu Lee</dd>
        <dt>Start Date</dt>
        <dd>2020-04-01 (12 days ago)</dd>
        <dt>End date</dt>
        <dd>2020-05-01 (23 days to go)</dd>
        <dt>Participants</dt>
        <dd style="display: flex;justify-content: space-between;">
          <div>
            <b>Kyu Lee</b>
            <dl>
              <dt>Missed</dt>
              <dd>5 days (-$25)</dd>
              <dt>Success</dt>
              <dd>24</dd>
              <dt>Longest Streak</dt>
              <dd>12 days</dd>
              <dt>Current winnings</dt>
              <dd>$20</dd>
            </dl>
          </div>
          <div>
            <b>Kyu Lee</b>
            <dl>
              <dt>Missed</dt>
              <dd>5 days (-$25)</dd>
              <dt>Success</dt>
              <dd>24</dd>
              <dt>Longest Streak</dt>
              <dd>12 days</dd>
              <dt>Current winnings</dt>
              <dd>$20</dd>
            </dl>
          </div>
          <div>
            <b>Kyu Lee</b>
            <dl>
              <dt>Missed</dt>
              <dd>5 days (-$25)</dd>
              <dt>Success</dt>
              <dd>24</dd>
              <dt>Longest Streak</dt>
              <dd>12 days</dd>
              <dt>Current winnings</dt>
              <dd>$20</dd>
            </dl>
          </div>
        </dd>
      </dl>

      <div v-for="oneday of groupedUpdates" :key="oneday[0]['timestamp'].toDate().toISOString()">
        <h3>{{ oneday[0]['timestamp'].toDate().toISOString().slice(0,10) }}</h3>
        <div class="daily-update">
          <div v-for="update of oneday" :key="update.id">
            <h4>{{ update.name }}</h4>
            <img :src="update.url" style="width: 300px;">
          </div>
        </div>
      </div>
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
        selectedBet: {},
        showStats: false,
        updates: [],
        dates: [],
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
    watch: {
      'selectedBet': 'setupUpdates',
    },
    mounted() {

      // eslint-disable-next-line no-undef
      firebase.firestore().
          collection('bets').
          where('members', 'array-contains', this.$root.$data.user.uid).
          onSnapshot(snapshot => {
            const betlist = [];
            snapshot.forEach(result => {
              betlist.push({...result.data(), id: result.id});
            });
            if (betlist.length > 0) {
              this.selectedBet = betlist[0];
            }
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
                this.cardSummary = `${qs.get('brand')}(${qs.get('last4')})`;
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
    computed: {
      uid() {
        return this.$root.$data.user.uid;
      },
      name() {
        return this.$root.$data.user.displayName;
      },
      sortedUpdates() {
        const sorted = [...this.updates];
        return sorted.sort((b, a) => {
          if (a.timestamp < b.timestamp) {
            return -1;
          } else if (a.timestamp.a > b.timestamp) {
            return 1;
          } else {
            return 0;
          }
        });
      },
      groupedUpdates() {

        return this.sortedUpdates.reduce((acc, val) => {
          const lastVal = acc.slice(-1)[0];
          console.log('lastval: ', lastVal);
          if (lastVal) {
            // console.log('last val time: ', lastVal[0]['timestamp'].toDate())
            if (lastVal[0]['timestamp'].toDate().toISOString().slice(0, 10) !==
                val['timestamp'].toDate().toISOString().slice(0, 10)) {
              acc.push([val]);
            } else {
              acc.slice(-1)[0].push(val);
            }
          } else {
            acc.push([val]);
          }

          console.log(acc);
          return acc;
        }, []);
      },
    },
    methods: {
      setupUpdates() {
        if (!this.selectedBet.id) {
          return;
        }
        // updates
        // eslint-disable-next-line no-undef
        firebase.firestore().
            collection(`bets/${this.selectedBet.id}/updates`).
            orderBy('timestamp', 'desc').
            onSnapshot(qsnapshot => {
              const updates = [];
              qsnapshot.forEach(async snapshot => {

                // eslint-disable-next-line no-undef
                const imgRef = firebase.app().storage().ref().child(snapshot.get('imagePath'));
                const url = await imgRef.getDownloadURL();
                updates.push({...snapshot.data(), id: snapshot.id, url: url});
                // console.log(snapshot.get('timestamp').toDate().toISOString().slice(0,10));
              });
              this.updates = updates;
            });
      },
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
      handleFileUpload(files) {
        if (!files || files.length < 1) {
          return;
        }
        console.log(files);
        // eslint-disable-next-line no-undef
        let storageRef = firebase.app().storage().ref();
        const fileRef = storageRef.child(
            `updates/${this.uid}/${new Date().toISOString().substr(0, 10)}-${Math.random().toString(36).substring(7)}`);
        fileRef.put(files[0]).then(snapshot => {
          console.log('upload done');
          console.log(fileRef.fullPath);
          console.log(snapshot);
          this.$refs.file.value = '';

          // eslint-disable-next-line no-undef
          firebase.firestore().collection(`bets/${this.selectedBet.id}/updates`).add({
            imagePath: fileRef.fullPath,
            timestamp: new Date(),
            uid: this.uid,
            name: this.name,
          }).then(() => {
            alert('success');
          }).catch(error => {
            alert(error.message);
          });
        }).catch(error => {
          alert(error.message);
        });

      },
    },
  };
</script>

<style scoped>
  button {
    padding: .3em 1em;
    border: none;
    background: #607D8B;
    color: white;
    line-height: 1.5em;
    height: fit-content;
    border-radius: 5px;
  }
  .top-menu {
    display: flex;
    justify-content: space-between;
    padding: 10px;
    background-color: #2196F3;
    color: white;
  }

  .loggedin-page {
    /*max-width: 100%;*/
    /*margin: 0 auto;*/
  }

  .creditcard-message {
    margin: 1em 0;
    padding: 1em;
    background-color: #E1F5FE;
    border-radius: 10px;
  }

  .bet-list {
    margin-top: 1em;
    display: flex;
  }

  h3 {
    margin-bottom: 0;
    background-color: #eee;
    padding: .3em;
  }

  a {
    color: blue;
    text-decoration: underline;
    cursor: pointer;
  }

  .daily-update {
    display: flex;
    justify-content: space-between;
    overflow-x: auto;
  }

  .heading > h1 {
    margin-bottom: 0;
    /*display: flex;*/
    /*justify-content: space-between;*/
    /*align-items: center;*/
  }

  .heading > input {
    margin-top: .5em;
  }

  div.stats {
    margin-top: 1em;
  }

  a.upload {
    font-size: 1.2em;
    font-weight: bold;
  }

  dl {
    margin-top: 0;
  }

  dt {
    padding: .5em;
  }

  dd {
    margin-left: 1.5em;
  }
</style>
