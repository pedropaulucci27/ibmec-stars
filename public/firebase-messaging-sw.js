importScripts('https://www.gstatic.com/firebasejs/11.8.1/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/11.8.1/firebase-messaging-compat.js');

firebase.initializeApp({
  apiKey: "AIzaSyBqwfYeFzUrK9aJzuWB_cn6IfimLHYjsXo",
  authDomain: "ibmec-stars.firebaseapp.com",
  projectId: "ibmec-stars",
  storageBucket: "ibmec-stars.firebasestorage.app",
  messagingSenderId: "961950149197",
  appId: "1:961950149197:web:940f88fcc88c2a80f8ca04"
});

const messaging = firebase.messaging();

messaging.onBackgroundMessage(payload => {
  const n = payload.notification ?? {};
  self.registration.showNotification(n.title ?? 'Ibmec Stars', {
    body: n.body ?? '',
    icon: '/icon-192.png',
    badge: '/icon-192.png',
    data: {url: 'https://ibmec-stars.web.app', ...(payload.data ?? {})}
  });
});

self.addEventListener('notificationclick', e => {
  e.notification.close();
  const url = e.notification.data?.url ?? 'https://ibmec-stars.web.app';
  e.waitUntil(clients.openWindow(url));
});
