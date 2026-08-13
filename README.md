# Ibmec Stars 🏙️

PWA para alunos do Ibmec acompanharem o **CR (Coeficiente de Rendimento)** ao longo do curso. Em vez de uma planilha de notas comum, o app traduz o desempenho acadêmico numa cidade 3D: cada disciplina vira um prédio, e quanto melhor a nota, mais alto/bonito o prédio fica. Também tem leaderboard por curso, simulador de revisão e importação automática de notas direto do portal do aluno.

**App:** https://ibmec-stars.web.app

## O que o app faz

- **Login com Google** e cadastro do curso do aluno (Engenharia de Software, Ciência de Dados, Direito, etc. — cursos de Tecnologia são agrupados no ranking).
- **Cálculo de CR** disciplina a disciplina e por semestre, reproduzindo as fórmulas de aprovação do Ibmec (AC, AP1, AP2 e TP, incluindo casos de nota parcial/pendente).
- **Import via SIA**: um bookmarklet (favorito de navegador) lê a página "Notas de Provas" do portal acadêmico (SIA), extrai as notas de cada disciplina e manda pro app através de um link — sem digitar nada manualmente.
- **Simulador de revisão**: o aluno mexe em quanto pretende ganhar de pontos na revisão de AP1/AP2 e vê o impacto no CR final antes de decidir se vale a pena fazer a prova.
- **Leaderboard por curso**: ranking opt-in dos alunos do mesmo curso, mostrando posição e CR.
- **Modo cidade (3D)**: uma visualização em Three.js/WebGL, navegável em primeira pessoa, onde cada disciplina cursada é um prédio/LEGO cuja altura e acabamento refletem o desempenho nela.
- **Reações sociais**: outros alunos podem reagir à sua cidade com um emoji, o que dispara uma notificação push pra você.
- **Notificações push** via OneSignal (principal) e Firebase Cloud Messaging (fallback/nativo), incluindo quando alguém reage à sua cidade.
- **PWA instalável** (Android/iOS/desktop), com ícones e splash próprios, funcionando fora do navegador.
- **Compartilhamento via WhatsApp** do resumo de notas/CR.

## Stack

**Frontend**
- HTML5 + CSS3 + JavaScript puro (ES Modules), sem framework nem build step — o app inteiro roda a partir de um único `index.html`.
- [GSAP](https://gsap.com/) 3.12 (core + plugins `TextPlugin` e `ScrollTrigger`) para animações de UI.
- [Three.js](https://threejs.org/) 0.160 (WebGL), carregado sob demanda, para o "modo cidade" 3D em primeira pessoa.
- Canvas API (2D) para o fundo animado e o efeito de confete.
- PWA: `manifest.json`, service workers dedicados, ícones gerados via script Python.

**Backend / infraestrutura (Firebase)**
- **Firebase Authentication** — login com Google.
- **Cloud Firestore** — dados dos alunos, leaderboard e reações entre usuários.
- **Firebase Hosting** — hospedagem do app estático.
- **Cloud Functions** (Node.js 20, `firebase-functions` v2 + `firebase-admin` v13) — envio de notificações push.
- **Firebase Cloud Messaging** (SDK compat, no service worker) — push nativo/fallback.
- **Secret Manager** — guarda a REST API key do OneSignal usada pela Cloud Function, fora do código-fonte.

**Notificações**
- [OneSignal](https://onesignal.com/) Web SDK v16 — canal principal de push.

**Integrações**
- **SIA** (portal acadêmico do Ibmec) — bookmarklet em JavaScript que faz parsing da tabela de notas da página e importa os dados pro app via query string.

**Scripts auxiliares**
- Python + [Pillow](https://python-pillow.org/) (`gen_icon.py`) — geração programática dos ícones do PWA.

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
