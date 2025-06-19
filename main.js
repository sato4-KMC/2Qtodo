import { initializeApp } from "https://www.gstatic.com/firebasejs/11.9.1/firebase-app.js";
import { getAnalytics } from "https://www.gstatic.com/firebasejs/11.9.1/firebase-analytics.js";
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/11.9.1/firebase-auth.js";

// Firebase 初期化
const firebaseConfig = {
  apiKey: "AIzaSyDk9Iq4ZGZ3FhVwgpcGju1LlIRBNmqyZos",
  authDomain: "qtodo-d8ec8.firebaseapp.com",
  projectId: "qtodo-d8ec8",
  storageBucket: "qtodo-d8ec8.firebasestorage.app",
  messagingSenderId: "508249025548",
  appId: "1:508249025548:web:68007931abb17fa1415229",
  measurementId: "G-BSGWZJ0RFL"
};

const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);

// Google Calendar API 定数定義
const CLIENT_ID = '693462078129-6udiv93h2ip1gjkfi1n78vd20nppfvq7.apps.googleusercontent.com';
const API_KEY = 'AIzaSyDwWeP04_wH7cW7JbT1OATv5C_JdhG7j74';
const DISCOVERY_DOC = 'https://www.googleapis.com/discovery/v1/apis/calendar/v3/rest';
const SCOPES = 'https://www.googleapis.com/auth/calendar.readonly';

// Firebase Auth setup
const auth = getAuth();
const provider = new GoogleAuthProvider();
provider.addScope('https://www.googleapis.com/auth/calendar.readonly');
provider.setCustomParameters({
  prompt: 'consent',          // ✅ 毎回許可画面を出すことで明示的にスコープを要求
  access_type: 'offline'      // ✅ リフレッシュトークンを取得するために必要
});

// ファイル冒頭付近に追加
let tokenClient;
let accessToken = null;

// 🔐 ユーザーがログインボタンをクリックしたとき
const loginBtn = document.getElementById("login-btn");
loginBtn.addEventListener("click", async () => {
  try {
    console.log("🟢 ログイン開始");
    const result = await signInWithPopup(auth, provider);
    const cred = GoogleAuthProvider.credentialFromResult(result);
    const accessTokenFirebase = cred.accessToken;
    if (accessTokenFirebase) {
      console.log("🔑 アクセストークン:", accessTokenFirebase);
      // 💡 セッション単位で保持するため、セキュリティを考慮して sessionStorage を使用
      sessionStorage.setItem("google_access_token", accessTokenFirebase);
    }
    console.log("✅ ログイン成功");
  } catch (e) {
    alert("ログインに失敗しました");
    console.error("❌ ログインエラー:", e);
  }
});

// 🔓 ログアウト処理
const logoutBtn = document.getElementById("logout-btn");
logoutBtn.addEventListener("click", async () => {
  console.log("🔴 ログアウトします");
  sessionStorage.removeItem("google_access_token");
  await signOut(auth);
});

// 👤 認証状態の変化を監視
const calendarBtn = document.getElementById("calendar-btn");
onAuthStateChanged(auth, async (user) => {
  if (user) {
    console.log("✅ ログイン状態を検出:", user.email);
    loginBtn.classList.add("hidden");
    logoutBtn.classList.remove("hidden");
    calendarBtn.classList.remove("hidden");
  } else {
    console.log("👋 ログアウト状態です");
    loginBtn.classList.remove("hidden");
    logoutBtn.classList.add("hidden");
    calendarBtn.classList.add("hidden");
  }
});

// 既存 onAuthStateChanged の後に追加
window.onload = () => {
  gapi.load('client', async () => {
    await gapi.client.init({
      apiKey: API_KEY,
      discoveryDocs: [DISCOVERY_DOC]
    });

    tokenClient = google.accounts.oauth2.initTokenClient({
      client_id: CLIENT_ID,
      scope: SCOPES,
      callback: (tokenResponse) => {
        accessToken = tokenResponse.access_token;
        console.log("🔑 GISアクセストークン:", accessToken);
        tryListEvents(accessToken);  // GISで取得したトークンで予定取得
      }
    });
  });
};

// 📅 Googleカレンダー予定を取得
calendarBtn.addEventListener("click", () => {
  console.log("📥 予定の取得を開始");
  safeListEvents();
});

// Google Calendar API function
function listUpcomingEvents() {
  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const todayEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);

  const calendarParams = {
    calendarId: 'primary',
    timeMin: todayStart.toISOString(),
    timeMax: todayEnd.toISOString(),
    showDeleted: false,
    singleEvents: true,
    maxResults: 1,
    orderBy: 'startTime'
  };

  console.log("📤 API呼び出しパラメータ:", calendarParams);

  gapi.client.calendar.events.list(calendarParams).then(response => {
    const events = response.result.items;
    console.log("📄 カレンダーイベント取得結果:", events);
    const detail = document.getElementById('event-detail');
    detail.innerHTML = '';

    if (events.length === 0) {
      detail.innerHTML = '予定は見つかりませんでした。';
      detail.classList.remove("hidden");
      return;
    }

    const event = events[0];
    const title = event.summary || "タイトルなし";
    const description = event.description || "説明なし";
    const start = new Date(event.start.dateTime || event.start.date);
    const end = new Date(event.end.dateTime || event.end.date);
    const durationMin = Math.round((end - start) / (1000 * 60));
    const startTimeStr = `${start.getHours()}:${String(start.getMinutes()).padStart(2, '0')}`;
    const endTimeStr = `${end.getHours()}:${String(end.getMinutes()).padStart(2, '0')}`;
    const htmlLink = event.htmlLink || "#";

    detail.innerHTML = `
      ${title}<br>
      ${startTimeStr} - ${endTimeStr}（${durationMin}分間）<br>
      ${description}<br>
      <a href="${htmlLink}" target="_blank">URL</a>
    `;
    detail.classList.remove("hidden");

    const timeDiffMin = Math.round((start - new Date()) / (1000 * 60));
    const nextEvent = document.getElementById("next-event");
    nextEvent.textContent = `▶ 次の予定まで ${timeDiffMin}分`;
  }).catch(error => {
    console.error("❌ APIエラー内容:", error);
  });
}

// safeListEvents 関数を書き換え
async function safeListEvents() {
  const user = auth.currentUser;
  if (!user) {
    alert("ログインしてください");
    return;
  }

  try {
    tokenClient.requestAccessToken({ prompt: 'consent' });
  } catch (err) {
    console.error("❌ GISトークン取得失敗:", err);
    alert("カレンダーアクセスに失敗しました。");
  }
}

// tryListEvents を accessToken 引数付きに変更
async function tryListEvents(accessToken) {
  if (!accessToken) throw new Error("アクセストークンがありません");

  gapi.client.setToken({ access_token: accessToken });
  console.log("📡 APIにアクセスします");
  listUpcomingEvents();
}
