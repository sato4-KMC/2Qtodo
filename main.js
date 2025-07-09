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
const logoutBtnBlank = document.getElementById("logout-btn-blank");
logoutBtn.addEventListener("click", async () => {
  console.log("🔴 ログアウトします");
  sessionStorage.removeItem("google_access_token");
  await signOut(auth);
});
logoutBtnBlank.addEventListener("click", async () => {
  console.log("🔴 ログアウトします");
  sessionStorage.removeItem("google_access_token");
  await signOut(auth);
});

function watchAuthState() {
  onAuthStateChanged(auth, async (user) => {
    const planBlock = document.querySelector('.top-block-plan');
    const blankBlock = document.querySelector('.top-block-blank');
    const logoutBlock = document.querySelector('.top-block-logout');

    if (user) {
      console.log("✅ ログイン状態を検出:", user.email);
      if (planBlock) planBlock.style.display = "none";
      if (blankBlock) blankBlock.style.display = "flex";
      if (logoutBlock) logoutBlock.style.display = "none";

      const nextEvent = await fetchTodayNextEvent();
      if (nextEvent) {
        window.nextEvent = nextEvent;
        console.log("📌 表示用予定タイトル:", nextEvent.summary);
        if (planBlock) planBlock.style.display = "flex";
        if (blankBlock) blankBlock.style.display = "none";

        // 分数表示用span（2番目のspan）
        const planTimeSpan = planBlock.querySelector('.top-block-plan-time span:nth-child(2)');
        // タイトル用div（font-size:22px, bold）
        const planTitleDiv = planBlock.querySelector('div[style*="font-size: 22px"][style*="font-weight: bold"]');
        // 説明用div（font-size:14px で、top-block-plan-time内span以外）
        // 22pxでない14pxのdivを取得
        const planDescDivs = planBlock.querySelectorAll('div[style*="font-size: 14px;"]');
        let planDescDiv = null;
        planDescDivs.forEach(div => {
          // top-block-plan-time内のspanではないdivを選ぶ
          if (!div.closest('.top-block-plan-time')) planDescDiv = div;
        });

        // 何分後か計算
        const now = new Date();
        const start = new Date(nextEvent.start?.dateTime || nextEvent.start?.date);
        const diffMin = Math.max(0, Math.floor((start - now) / 60000));

        if (planTimeSpan) planTimeSpan.textContent = diffMin;
        if (planTitleDiv) planTitleDiv.textContent = nextEvent.summary || "";
        if (planDescDiv) planDescDiv.textContent = nextEvent.description || "";
      }
    } else {
      console.log("👋 ログアウト状態です");
      if (logoutBlock) logoutBlock.style.display = "flex";
      if (planBlock) planBlock.style.display = "none";
      if (blankBlock) blankBlock.style.display = "none";
    }
  });
}

// 既存 onAuthStateChanged の後に追加
window.onload = () => {
  gapi.load('client', async () => {
    await gapi.client.init({
      discoveryDocs: [DISCOVERY_DOC]
      // ✅ apiKey を削除
    });

    // ✅ アクセストークンを gapi に設定（あれば）
    const accessTokenStored = sessionStorage.getItem("google_access_token");
    if (accessTokenStored) {
      gapi.client.setToken({ access_token: accessTokenStored });
    }

    // tokenClient 初期化（GISログイン用）も維持
    tokenClient = google.accounts.oauth2.initTokenClient({
      client_id: CLIENT_ID,
      scope: SCOPES,
      callback: (tokenResponse) => {
        accessToken = tokenResponse.access_token;
        sessionStorage.setItem("google_access_token", accessToken);
        gapi.client.setToken({ access_token: accessToken }); // これも追加
      }
    });

    watchAuthState();
  });
};

async function fetchTodayNextEvent() {
  const now = new Date();
  const todayEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);

  const accessTokenStored = sessionStorage.getItem("google_access_token");
  if (accessTokenStored) {
    gapi.client.setToken({ access_token: accessTokenStored });
  }

  const calendarParams = {
    calendarId: 'primary',
    timeMin: now.toISOString(),
    timeMax: todayEnd.toISOString(),
    showDeleted: false,
    singleEvents: true,
    maxResults: 1,
    orderBy: 'startTime'
  };

  console.log("📤 直近予定取得APIパラメータ:", calendarParams);

  try {
    const response = await gapi.client.calendar.events.list(calendarParams);
    const events = response.result.items;
    if (events && events.length > 0) {
      console.log("📄 直近予定:", events[0]);
      return events[0];
    } else {
      console.log("📭 今日の残り予定はありません");
      return null;
    }
  } catch (error) {
    console.error("❌ 直近予定取得エラー:", error);
    return null;
  }
}

window.fetchTodayNextEvent = fetchTodayNextEvent;