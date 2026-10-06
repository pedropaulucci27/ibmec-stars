const {onDocumentCreated} = require('firebase-functions/v2/firestore');
const {onCall, HttpsError} = require('firebase-functions/v2/https');
const {defineSecret} = require('firebase-functions/params');
const {initializeApp} = require('firebase-admin/app');
const {getMessaging} = require('firebase-admin/messaging');
const {getFirestore, FieldValue} = require('firebase-admin/firestore');

initializeApp();

const oneSignalRestKey = defineSecret('ONESIGNAL_REST_KEY');
const ONESIGNAL_APP_ID = '7bd240f1-a6de-4f04-9078-7d2d521b9b52';

// Só as reações que existem no app (as mesmas das regras do Firestore)
const EMOJIS = ['🔥', '👏', '😮', '💀'];
// No máximo 1 push por minuto de um mesmo aluno para um mesmo destinatário
const PUSH_INTERVAL_MS = 60 * 1000;

// O nome que aparece na notificação vem do servidor (a entrada do ranking de quem reagiu), nunca
// do que o cliente mandou: assim ninguém se passa por outra pessoa ("Reitoria reagiu...").
async function senderName(db, uid) {
  const snap = await db.doc(`leaderboard/${uid}`).get();
  const d = snap.data();
  if (!d || d.anonymous || typeof d.displayName !== 'string') return 'Alguém';
  return d.displayName.replace(/[\u0000-\u001f\u007f]/g, '').trim().slice(0, 24) || 'Alguém';
}

// Reserva a vez de mandar push de `fromUid` para `targetUid`; false se ainda está no intervalo.
// A coleção _pushLimits não tem regra no Firestore, então só o servidor lê e escreve nela.
async function takePushSlot(db, fromUid, targetUid) {
  const ref = db.doc(`_pushLimits/${fromUid}_${targetUid}`);
  return db.runTransaction(async tx => {
    const last = (await tx.get(ref)).data()?.at?.toMillis?.() ?? 0;
    if (Date.now() - last < PUSH_INTERVAL_MS) return false;
    tx.set(ref, {at: FieldValue.serverTimestamp()});
    return true;
  });
}

const validUid = v => typeof v === 'string' && /^[A-Za-z0-9]{1,128}$/.test(v);

exports.sendReactionPush = onDocumentCreated('cityReactions/{reactionId}', async event => {
  const data = event.data?.data();
  if (!data) return;

  const {targetUid, emoji, fromUid} = data;
  if (!validUid(targetUid) || !validUid(fromUid) || fromUid === targetUid || !EMOJIS.includes(emoji)) return;

  const db = getFirestore();
  const snap = await db.doc(`users/${targetUid}/prefs/settings`).get();
  const fcmToken = snap.data()?.fcmToken;
  if (!fcmToken) return;
  const fromName = await senderName(db, fromUid);

  try {
    await getMessaging().send({
      token: fcmToken,
      notification: {
        title: '🏙️ Ibmec Stars',
        body: `${emoji} ${fromName} reagiu ao seu prédio!`
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
  // Só aluno logado pode disparar push, e só para outro aluno, com uma das reações do app
  const fromUid = request.auth?.uid;
  if (!fromUid) throw new HttpsError('unauthenticated', 'Faça login para reagir.');
  const {targetUid, emoji} = request.data || {};
  if (!validUid(targetUid) || targetUid === fromUid) throw new HttpsError('invalid-argument', 'Destinatário inválido.');
  if (!EMOJIS.includes(emoji)) throw new HttpsError('invalid-argument', 'Reação inválida.');

  const db = getFirestore();
  if (!(await takePushSlot(db, fromUid, targetUid))) return {ok: false, reason: 'rate-limited'};
  const fromName = await senderName(db, fromUid);

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
  // Não devolve a resposta da OneSignal pro cliente (não precisa saber detalhes internos)
  if (!res.ok) console.error('OneSignal send failed:', res.status, await res.text());
  return {ok: res.ok};
});
