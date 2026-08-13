const {onDocumentCreated} = require('firebase-functions/v2/firestore');
const {onCall, HttpsError} = require('firebase-functions/v2/https');
const {defineSecret} = require('firebase-functions/params');
const {initializeApp} = require('firebase-admin/app');
const {getMessaging} = require('firebase-admin/messaging');
const {getFirestore} = require('firebase-admin/firestore');

initializeApp();

const oneSignalRestKey = defineSecret('ONESIGNAL_REST_KEY');
const ONESIGNAL_APP_ID = '7bd240f1-a6de-4f04-9078-7d2d521b9b52';

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

exports.sendOneSignalPush = onCall({secrets: [oneSignalRestKey]}, async request => {
  const {targetUid, emoji, fromName} = request.data || {};
  if (!targetUid) throw new HttpsError('invalid-argument', 'targetUid is required');

  const res = await fetch('https://api.onesignal.com/notifications', {
    method: 'POST',
    headers: {
      'Authorization': `Key ${oneSignalRestKey.value()}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      app_id: ONESIGNAL_APP_ID,
      include_aliases: {external_id: [targetUid]},
      target_channel: 'push',
      headings: {en: '🏙️ Ibmec Stars', pt: '🏙️ Ibmec Stars'},
      contents: {en: `${emoji} ${fromName} reagiu ao seu prédio!`, pt: `${emoji} ${fromName} reagiu ao seu prédio!`},
      url: 'https://ibmec-stars.web.app'
    })
  });
  return res.json();
});
