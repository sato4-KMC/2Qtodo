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

// 🔐 ユーザーがログインボタンをクリックしたとき
const loginBtn = document.getElementById("login-btn");
loginBtn.addEventListener("click", async () => {
  try {
    console.log("🟢 ログイン開始");
    const result = await signInWithPopup(auth, provider);
    const cred = GoogleAuthProvider.credentialFromResult(result);
    const accessToken = cred.accessToken;
    if (accessToken) {
      console.log("🔑 アクセストークン:", accessToken);
      // 💡 セッション単位で保持するため、セキュリティを考慮して sessionStorage を使用
      sessionStorage.setItem("google_access_token", accessToken);
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

// 📅 Googleカレンダー予定を取得
calendarBtn.addEventListener("click", () => {
  console.log("📥 予定の取得を開始");
  safeListEvents();
});

// Google Calendar API function
function listUpcomingEvents() {
  const calendarParams = {
    calendarId: 'primary',
    timeMin: new Date().toISOString(),
    showDeleted: false,
    singleEvents: true,
    maxResults: 5,
    orderBy: 'startTime'
  };

  // デバッグ用: API呼び出しパラメータを出力
  console.log("📤 API呼び出しパラメータ:", calendarParams);

  gapi.client.calendar.events.list(calendarParams).then(response => {
    const events = response.result.items;
    console.log("📄 カレンダーイベント取得結果:", events);
    const eventsList = document.getElementById('events');
    eventsList.innerHTML = '';

    if (events.length === 0) {
      const li = document.createElement('li');
      li.textContent = '予定は見つかりませんでした。';
      eventsList.appendChild(li);
    } else {
      events.forEach(event => {
        const when = event.start.dateTime || event.start.date;
        const li = document.createElement('li');
        li.textContent = `${event.summary} (${when})`;
        eventsList.appendChild(li);
      });
    }
  }).catch(error => {
    console.error("❌ APIエラー内容:", error);
  });
}

async function safeListEvents() {
  try {
    await tryListEvents();
  } catch (err) {
    console.warn("⚠️ トークンが無効かもしれません。再ログインを促します。", err);
    alert("トークンの有効期限が切れているため、再ログインが必要です。");
    try {
      const result = await signInWithPopup(auth, provider);
      const cred = GoogleAuthProvider.credentialFromResult(result);
      const newAccessToken = cred.accessToken;
      if (newAccessToken) {
        sessionStorage.setItem("google_access_token", newAccessToken);
        await tryListEvents(); // 再実行
      } else {
        throw new Error("アクセストークンが取得できませんでした。");
      }
    } catch (e) {
      alert("再ログインに失敗しました。");
      console.error("❌ 再ログイン失敗:", e);
    }
  }
}

async function tryListEvents() {
  const user = auth.currentUser;
  if (!user) throw new Error("未ログイン状態です");

  const accessToken = sessionStorage.getItem("google_access_token");
  if (!accessToken) throw new Error("トークンが存在しません");

  await gapi.load("client", async () => {
    await gapi.client.init({
      apiKey: API_KEY,
      clientId: CLIENT_ID,
      discoveryDocs: [DISCOVERY_DOC],
      scope: SCOPES
    });
    console.log("🔍 取得したアクセストークン:", accessToken);
    gapi.client.setToken({ access_token: accessToken });
    console.log("📡 APIにアクセスします（再試行）");
    listUpcomingEvents();
  });
}
