const functions = require('firebase-functions');
const admin = require('firebase-admin');
admin.initializeApp();
const stripe = require('stripe')(functions.config().stripe.token);
const currency = functions.config().stripe.currency || 'CAD';
// // Create and Deploy Your First Cloud Functions
// // https://firebase.google.com/docs/functions/write-firebase-functions
//
// exports.helloWorld = functions.https.onRequest((request, response) => {
//  response.send("Hello from Firebase!");
// });
// When a user is created, register them with Stripe
exports.createStripeCustomer = functions.auth.user().onCreate(async (user) => {
  const customer = await stripe.customers.create({email: user.email});
  return admin.firestore().collection('stripe_customers').doc(user.uid).set({customer_id: customer.id});
});


// When a user deletes their account, clean up after them
exports.cleanupUser = functions.auth.user().onDelete(async (user) => {
  const snapshot = await admin.firestore().collection('stripe_customers').doc(user.uid).get();
  const customer = snapshot.data();
  await stripe.customers.del(customer.customer_id);
  return admin.firestore().collection('stripe_customers').doc(user.uid).delete();
});

// Add a payment source (card) for a user by writing a stripe payment source token to Cloud Firestore
exports.addPaymentSource = functions.firestore.document('/stripe_customers/{userId}/tokens/{pushId}').onCreate(async (snap, context) => {
  const source = snap.data();
  const token = source.token;
  if (source === null){
    return null;
  }

  try {
    const snapshot = await admin.firestore().collection('stripe_customers').doc(context.params.userId).get();
    const customer =  snapshot.data().customer_id;
    const response = await stripe.customers.createSource(customer, {source: token});
    await snap.ref.delete();
    return admin.firestore().collection('stripe_customers').doc(context.params.userId).collection("sources").doc(response.fingerprint).set(response, {merge: true});
  } catch (error) {
    // await snap.ref.set({'error':userFacingMessage(error)},{merge:true});
    // return reportError(error, {user: context.params.userId});
    console.log(error);
    return null;
  }
});


// Saves a message to the Firebase Realtime Database but sanitizes the text by removing swearwords.
exports.joinBet = functions.https.onCall(async (data, context) => {

  if (!context.auth) {
    // Throwing an HttpsError so that the client gets the error details.
    throw new functions.https.HttpsError('failed-precondition',
        'The function must be called ' +
        'while authenticated.');
  }

  const uid = context.auth.uid;
  const betId = data.betId;

  const bet = await admin.firestore().doc(`bets/${betId}`).get();

  if (!bet.exists) {
    throw new functions.https.HttpsError('failed-precondition', "that bet does not exist");
  }

  const existingMembers = bet.get('members') || [];

  if (existingMembers.indexOf(uid) >= 0) {
    throw new functions.https.HttpsError('failed-precondition', 'you are already a member');
  }

  const stripeCust = await admin.firestore().doc(`stripe_customers/${uid}`).get();
  if (!stripeCust.exists) {
    throw new functions.https.HttpsError('failed-precondition', 'missing stripe customer');
  }

  const custId = stripeCust.get('customer_id');

  existingMembers.push(uid);

  await stripe.subscriptions.create({
    customer: custId,
    items: [{plan:'plan_HAXFxiSiWV3i8q'}],
  }, (err, subscription) => {
    if (err) {
      console.error(err);
    } else {
      console.log(subscription);
    }
  });

  await bet.ref.update({members: existingMembers});
});
