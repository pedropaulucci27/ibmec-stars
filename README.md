# Ibmec Stars 🏙️

PWA para alunos do Ibmec acompanharem o CR (Coeficiente de Rendimento), simularem notas de revisão e competirem num leaderboard por curso — com um "modo cidade" que transforma o progresso acadêmico em prédios numa cidade 3D.

**App:** https://ibmec-stars.web.app

## Funcionalidades

- **Calculadora de CR** por curso e semestre, com fórmulas específicas do Ibmec (AC, AP1, AP2, TP).
- **Importação automática de notas** via bookmarklet que lê a página "Notas de Provas" do SIA e importa direto pro app.
- **Leaderboard por curso**, com opt-in de participação e posição do usuário.
- **Simulador de revisão**: estima o ganho de CR ao ajustar pontos de AP1/AP2.
- **Modo cidade**: visualização em 3D (first-person) onde cada disciplina vira um prédio/LEGO baseado no desempenho.
- **Notificações push** (Firebase Cloud Messaging + OneSignal) quando alguém reage à sua cidade.
- **PWA instalável**, com ícones, splash e prompt de instalação.
- Compartilhamento de resultados via WhatsApp.

## Stack

- Frontend: HTML/CSS/JS vanilla (single-file `index.html`), [GSAP](https://gsap.com/) para animações.
- Backend: [Firebase](https://firebase.google.com/) — Auth (Google), Firestore, Hosting, Cloud Functions (Node 20).
- Notificações: Firebase Cloud Messaging + [OneSignal](https://onesignal.com/).

## Estrutura

```
index.html            # app inteiro (UI + lógica)
404.html               # página de erro
manifest.json           # manifest do PWA
firebase-messaging-sw.js / OneSignalSDKWorker.js   # service workers de push
firestore.rules         # regras de segurança do Firestore
firebase.json / .firebaserc  # config do projeto Firebase
functions/              # Cloud Functions (push notifications)
gen_icon.py              # script auxiliar de geração dos ícones
```

## Rodando localmente

Não há build step — é só abrir/servir o `index.html`. Para simular hosting + functions:

```bash
npm install -g firebase-tools
firebase login
firebase emulators:start
```

## Deploy

```bash
firebase deploy
```

A função `sendOneSignalPush` (em `functions/`) depende de um segredo configurado no Secret Manager — precisa ser definido uma vez antes do primeiro deploy das functions:

```bash
firebase functions:secrets:set ONESIGNAL_REST_KEY
firebase deploy --only functions
```
