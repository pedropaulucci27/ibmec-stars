const {onDocumentCreated} = require('firebase-functions/v2/firestore');
const {initializeApp} = require('firebase-admin/app');
const {getMessaging} = require('firebase-admin/messaging');
const {getFirestore} = require('firebase-admin/firestore');

initializeApp();

exports.sendReactionPush = onDocumentCreated('cityReactions/{reactionId}', async event => {
  const data = event.data?.data();
  if (!data) return;

  const {targetUid, emoji, fromName} = data;
  if (!targetUid) return;

  const db = getFirestore();
  const snap = await db.doc(`users/${targetUid}/prefs/settings`).get();
  const fcmToken = snap.data()?.fcmToken;
  if (!fcmToken) return;

  try {
    await getMessaging().send({
      token: fcmToken,
      notification: {
        title: '🏙️ Ibmec Stars',
        body: `${emoji} ${fromName || 'Alguém'} reagiu ao seu prédio!`
      },
      webpush: {
        notification: {
          icon: '/icon-192.png',
          badge: '/icon-192.png'
        },
        fcmOptions: {
          link: 'https://ibmec-stars.web.app'
        }
      }
    });
  } catch (e) {
    console.error('FCM send failed:', e.message);
  }
});
