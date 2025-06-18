
const dummyTasks = [
  {
    id: "1",
    title: "プレゼン資料作り",
    durationMin: 15,
    level: 3,
    createdAt: new Date().toISOString(),
    completed: false,
  },
  {
    id: "2",
    title: "CG課題",
    durationMin: 15,
    level: 2,
    createdAt: new Date().toISOString(),
    completed: false,
  },
  {
    id: "3",
    title: "メール送信",
    durationMin: 8,
    level: 1,
    createdAt: new Date().toISOString(),
    completed: false,
  },
];

function renderTasks(tasks, containerId) {
  const container = document.getElementById(containerId);
  if (!container) return;

  container.innerHTML = "";
  tasks.forEach((task) => {
    const card = document.createElement("div");
    card.className = "task-card";
    card.innerHTML = `
      <div>${task.title}</div>
      <div class="task-meta">
        <span>${task.durationMin}分</span>
        <span>レベル${task.level}</span>
      </div>
    `;
    container.appendChild(card);
  });
}

// 初期表示
renderTasks(dummyTasks.slice(0, 2), "suggested-tasks");
renderTasks(dummyTasks, "task-list");

// #next-eventクリックで予定詳細の表示/非表示を切り替え
const nextEvent = document.getElementById("next-event");
const eventDetail = document.getElementById("event-detail");
if (nextEvent && eventDetail) {
  nextEvent.addEventListener("click", () => {
    eventDetail.classList.toggle("hidden");
    // アイコンの向きも切り替え
    if (nextEvent.textContent?.startsWith("▶")) {
      nextEvent.textContent = nextEvent.textContent.replace("▶", "▼");
    } else if (nextEvent.textContent?.startsWith("▼")) {
      nextEvent.textContent = nextEvent.textContent.replace("▼", "▶");
    }
  });
}