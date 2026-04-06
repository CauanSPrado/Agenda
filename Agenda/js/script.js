//  ESTADO GLOBAL
let currentDate = new Date();
let reminders = {}; // { "YYYY-MM-DD": [ { text, done } ] }
let xp = 215;
let level = 8;
let xpPercent = 65;
let currentFilter = "all";
const XP_PER_REMINDER = 20;

//  ELEMENTOS
const monthYearElement = document.getElementById("month-year");
const calendarDaysEl = document.getElementById("calendar-days");
const prevBtn = document.getElementById("prev");
const nextBtn = document.getElementById("next");
const modalOverlay = document.getElementById("modal-overlay");
const modalClose = document.getElementById("modal-close");
const modalDateTitle = document.getElementById("modal-date-title");
const modalReminders = document.getElementById("modal-reminders");
const reminderInput = document.getElementById("reminder-input");
const btnAddReminder = document.getElementById("btn-add-reminder");
const xpValueEl = document.getElementById("xp-value");
const xpBarEl = document.getElementById("xp-bar");
const xpPercentEl = document.getElementById("xp-percent");
const levelValueEl = document.getElementById("level-value");
const missionCountEl = document.getElementById("mission-count");
const missionBarEl = document.getElementById("mission-bar");
const todayRemindersList = document.getElementById("today-reminders-list");
const progressMessage = document.getElementById("progress-message");
const toast = document.getElementById("toast");
const viewToday = document.getElementById("view-today");
const viewTimeline = document.getElementById("view-timeline");
const timelineBody = document.getElementById("timeline-body");
const bestDayValueEl = document.getElementById("best-day-value");
const bestDayExtraEl = document.getElementById("best-day-extra");
const worstDayValueEl = document.getElementById("worst-day-value");
const worstDayExtraEl = document.getElementById("worst-day-extra");
const weekdayChartEl = document.getElementById("weekday-chart");
const weekChartEl = document.getElementById("week-chart");

let selectedDateKey = null;
const themeToggle = document.getElementById("theme-toggle");
const themeToggleText = document.querySelector(".theme-toggle-text");
const themeToggleIcon = document.querySelector(".theme-toggle-icon");

function applyTheme(theme) {
    const isDark = theme === "dark";
    document.documentElement.classList.toggle("dark-theme", isDark);
    if (themeToggle) {
        themeToggle.setAttribute("aria-pressed", String(isDark));
    }
    if (themeToggleText) {
        themeToggleText.textContent = isDark ? "Tema claro" : "Tema escuro";
    }
    if (themeToggleIcon) {
        themeToggleIcon.textContent = isDark ? "☀️" : "🌙";
    }
}

function getPreferredTheme() {
    try {
        const savedTheme = localStorage.getItem("agenda-theme");
        if (savedTheme === "dark" || savedTheme === "light") {
            return savedTheme;
        }
    } catch (error) {
        return "light";
    }

    return window.matchMedia &&
        window.matchMedia("(prefers-color-scheme: dark)").matches
        ? "dark"
        : "light";
}

function toggleTheme() {
    const nextTheme = document.documentElement.classList.contains("dark-theme")
        ? "light"
        : "dark";
    try {
        localStorage.setItem("agenda-theme", nextTheme);
    } catch (error) {
        /* localStorage unavailable */
    }
    applyTheme(nextTheme);
}

applyTheme(getPreferredTheme());

if (themeToggle) {
    themeToggle.addEventListener("click", toggleTheme);
}

//  NAVEGAÇÃO DE VIEWS
document.querySelectorAll(".nav-item[data-view]").forEach((link) => {
    link.addEventListener("click", (e) => {
        e.preventDefault();
        document
            .querySelectorAll(".nav-item")
            .forEach((n) => n.classList.remove("active"));
        link.classList.add("active");
        const view = link.dataset.view;
        if (view === "today") {
            viewToday.style.display = "flex";
            viewTimeline.style.display = "none";
        } else if (view === "timeline") {
            viewToday.style.display = "none";
            viewTimeline.style.display = "flex";
            renderTimeline();
            syncTimelinePanel();
            renderProductivityReport();
        }
    });
});

//  HELPERS
function dateKey(year, month, day) {
    return `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}
function todayKey() {
    const t = new Date();
    return dateKey(t.getFullYear(), t.getMonth(), t.getDate());
}
function parseKey(key) {
    const [y, m, d] = key.split("-").map(Number);
    return new Date(y, m - 1, d);
}
function isPast(key) {
    const d = parseKey(key);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    d.setHours(0, 0, 0, 0);
    return d < today;
}
function isToday(key) {
    return key === todayKey();
}

function showToast(msg, type = "success") {
    toast.textContent = msg;
    toast.className = `toast toast-${type} show`;
    setTimeout(() => {
        toast.className = "toast";
    }, 2200);
}

function formatDateLabel(key) {
    const monthNames = [
        "Janeiro",
        "Fevereiro",
        "Março",
        "Abril",
        "Maio",
        "Junho",
        "Julho",
        "Agosto",
        "Setembro",
        "Outubro",
        "Novembro",
        "Dezembro",
    ];
    const [y, m, d] = key.split("-").map(Number);
    const date = new Date(y, m - 1, d);
    const weekDays = [
        "Domingo",
        "Segunda",
        "Terça",
        "Quarta",
        "Quinta",
        "Sexta",
        "Sábado",
    ];
    return {
        day: d,
        month: monthNames[m - 1],
        year: y,
        weekday: weekDays[date.getDay()],
    };
}

function formatDateShort(dateObj) {
    const d = String(dateObj.getDate()).padStart(2, "0");
    const m = String(dateObj.getMonth() + 1).padStart(2, "0");
    return `${d}/${m}`;
}

function getWeekStart(dateObj) {
    const d = new Date(dateObj);
    const day = d.getDay();
    const diff = (day + 6) % 7; // semana inicia na segunda
    d.setDate(d.getDate() - diff);
    d.setHours(0, 0, 0, 0);
    return d;
}

function collectDailyStats() {
    return Object.keys(reminders)
        .filter(
            (key) => Array.isArray(reminders[key]) && reminders[key].length > 0,
        )
        .map((key) => {
            const tasks = reminders[key];
            return {
                key,
                date: parseKey(key),
                total: tasks.length,
                done: tasks.filter((task) => task.done).length,
            };
        })
        .sort((a, b) => a.date - b.date);
}

function renderBarChart(container, items, fillClass, emptyMessage) {
    if (!container) return;
    if (!items || items.length === 0) {
        container.innerHTML = `<p class="bar-empty">${emptyMessage}</p>`;
        return;
    }

    const maxValue = Math.max(...items.map((item) => item.value), 0);
    container.innerHTML = items
        .map((item) => {
            const width =
                maxValue > 0
                    ? item.value === 0
                        ? 0
                        : Math.max(4, Math.round((item.value / maxValue) * 100))
                    : 0;
            return `
            <div class="bar-row">
                <span class="bar-label">${item.label}</span>
                <div class="bar-track">
                    <div class="bar-fill ${fillClass}" style="width:${width}%"></div>
                </div>
                <span class="bar-value">${item.value}</span>
            </div>
        `;
        })
        .join("");
}

function renderProductivityReport() {
    const dailyStats = collectDailyStats();

    if (dailyStats.length === 0) {
        if (bestDayValueEl) bestDayValueEl.textContent = "Sem dados";
        if (bestDayExtraEl)
            bestDayExtraEl.textContent = "Adicione tarefas para começar";
        if (worstDayValueEl) worstDayValueEl.textContent = "Sem dados";
        if (worstDayExtraEl)
            worstDayExtraEl.textContent = "Adicione tarefas para começar";
        renderBarChart(
            weekdayChartEl,
            [],
            "bar-fill-weekday",
            "Sem tarefas concluídas ainda.",
        );
        renderBarChart(
            weekChartEl,
            [],
            "bar-fill-week",
            "Sem tarefas concluídas ainda.",
        );
        return;
    }

    const bestDay = dailyStats.reduce((best, current) => {
        if (current.done > best.done) return current;
        if (current.done === best.done && current.total > best.total)
            return current;
        return best;
    }, dailyStats[0]);

    const worstDay = dailyStats.reduce((worst, current) => {
        if (current.done < worst.done) return current;
        if (current.done === worst.done && current.total > worst.total)
            return current;
        return worst;
    }, dailyStats[0]);

    const bestLabel = formatDateLabel(bestDay.key);
    const worstLabel = formatDateLabel(worstDay.key);

    if (bestDayValueEl) {
        bestDayValueEl.textContent = `${bestLabel.weekday}, ${bestLabel.day} de ${bestLabel.month}`;
    }
    if (bestDayExtraEl) {
        bestDayExtraEl.textContent = `${bestDay.done} tarefa${bestDay.done !== 1 ? "s" : ""} concluída${bestDay.done !== 1 ? "s" : ""}`;
    }
    if (worstDayValueEl) {
        worstDayValueEl.textContent = `${worstLabel.weekday}, ${worstLabel.day} de ${worstLabel.month}`;
    }
    if (worstDayExtraEl) {
        worstDayExtraEl.textContent = `${worstDay.done} tarefa${worstDay.done !== 1 ? "s" : ""} concluída${worstDay.done !== 1 ? "s" : ""}`;
    }

    const weekdayNames = [
        "Domingo",
        "Segunda",
        "Terça",
        "Quarta",
        "Quinta",
        "Sexta",
        "Sábado",
    ];
    const weekdayTotals = new Array(7).fill(0);
    dailyStats.forEach((day) => {
        const weekday = day.date.getDay();
        weekdayTotals[weekday] += day.done;
    });

    const weekdayItems = weekdayTotals.map((value, index) => ({
        label: weekdayNames[index],
        value,
    }));

    const weekMap = new Map();
    dailyStats.forEach((day) => {
        const weekStart = getWeekStart(day.date);
        const weekStartKey = `${weekStart.getFullYear()}-${String(weekStart.getMonth() + 1).padStart(2, "0")}-${String(weekStart.getDate()).padStart(2, "0")}`;
        const weekEnd = new Date(weekStart);
        weekEnd.setDate(weekEnd.getDate() + 6);

        if (!weekMap.has(weekStartKey)) {
            weekMap.set(weekStartKey, {
                label: `${formatDateShort(weekStart)} a ${formatDateShort(weekEnd)}`,
                value: 0,
                date: weekStart,
            });
        }
        weekMap.get(weekStartKey).value += day.done;
    });

    const weeklyItems = Array.from(weekMap.values())
        .sort((a, b) => a.date - b.date)
        .slice(-8)
        .map((item) => ({ label: item.label, value: item.value }));

    renderBarChart(
        weekdayChartEl,
        weekdayItems,
        "bar-fill-weekday",
        "Sem tarefas concluídas ainda.",
    );
    renderBarChart(
        weekChartEl,
        weeklyItems,
        "bar-fill-week",
        "Sem tarefas concluídas ainda.",
    );
}

//  XP & PROGRESSO
function addXP(amount) {
    xp += amount;
    xpPercent += amount;
    if (xpPercent >= 100) {
        xpPercent -= 100;
        level++;
        levelValueEl.textContent = level;
        showToast(`🎉 Subiu para o Nível ${level}!`, "level");
    }
    xpValueEl.textContent = xp;
    xpBarEl.style.width = Math.min(xpPercent, 100) + "%";
    xpPercentEl.textContent = Math.round(xpPercent) + "%";
    syncTimelinePanel();
    updateMissions();
}

function syncTimelinePanel() {
    const tlXp = document.getElementById("tl-xp-value");
    const tlBar = document.getElementById("tl-xp-bar");
    const tlPct = document.getElementById("tl-xp-percent");
    const tlLvl = document.getElementById("tl-level-value");
    if (tlXp) tlXp.textContent = xp;
    if (tlBar) tlBar.style.width = Math.min(xpPercent, 100) + "%";
    if (tlPct) tlPct.textContent = Math.round(xpPercent) + "%";
    if (tlLvl) tlLvl.textContent = level;

    // Stats
    let totalDone = 0,
        totalPending = 0,
        totalMissed = 0;
    Object.keys(reminders).forEach((key) => {
        reminders[key].forEach((r) => {
            if (r.done) totalDone++;
            else if (isToday(key) || !isPast(key)) totalPending++;
            else totalMissed++;
        });
    });
    const total = totalDone + totalPending + totalMissed;
    const rate = total > 0 ? Math.round((totalDone / total) * 100) : 0;

    const el = (id) => document.getElementById(id);
    if (el("stat-done")) el("stat-done").textContent = totalDone;
    if (el("stat-pending")) el("stat-pending").textContent = totalPending;
    if (el("stat-missed")) el("stat-missed").textContent = totalMissed;
    if (el("tl-rate")) el("tl-rate").textContent = rate + "%";
    if (el("tl-rate-bar")) el("tl-rate-bar").style.width = rate + "%";

    const msgs = [
        "Adicione tarefas e comece! 🚀",
        "Bom começo, continue! 💪",
        "Você está indo bem! 🌟",
        "Mais da metade! Incrível!",
        "Quase lá! Não para! 🔥",
        "Campeão(ã)! Arrasou! 🏆",
    ];
    const idx = Math.min(Math.floor(rate / 20), msgs.length - 1);
    const summaryMsg = document.getElementById("tl-summary-msg");
    if (summaryMsg) summaryMsg.textContent = msgs[idx];

    renderProductivityReport();
}

function updateMissions() {
    const key = todayKey();
    const list = reminders[key] || [];
    const done = list.filter((r) => r.done).length;
    const total = Math.max(list.length, 6);
    missionCountEl.textContent = `${done}/${total}`;
    missionBarEl.style.width =
        total > 0 ? Math.round((done / total) * 100) + "%" : "0%";
    const msgs = [
        "Vamos começar o dia! 💪",
        "Ótimo começo, continue assim!",
        "Você está indo muito bem! 🌟",
        "Mais da metade feito! Incrível!",
        "Quase lá, não para agora! 🔥",
        "Missão cumprida! Você arrasou! 🏆",
    ];
    const idx = Math.min(
        Math.floor((done / Math.max(list.length, 1)) * msgs.length),
        msgs.length - 1,
    );
    progressMessage.textContent = done === 0 ? msgs[0] : msgs[idx];
}

//  PAINEL DE HOJE
function renderTodayReminders() {
    const key = todayKey();
    const list = reminders[key] || [];
    todayRemindersList.innerHTML = "";
    if (list.length === 0) {
        todayRemindersList.innerHTML =
            '<li class="no-reminders">Nenhum lembrete ainda</li>';
        return;
    }
    list.forEach((r, i) => {
        const li = document.createElement("li");
        li.className = "reminder-today-item" + (r.done ? " done" : "");
        li.innerHTML = `
            <span class="reminder-today-text">${r.text}</span>
            ${
                !r.done
                    ? `<button class="btn-confirm-today" data-index="${i}">✔ Feito</button>`
                    : '<span class="done-badge">✅</span>'
            }
        `;
        todayRemindersList.appendChild(li);
    });
    todayRemindersList.querySelectorAll(".btn-confirm-today").forEach((btn) => {
        btn.addEventListener("click", () => {
            confirmReminder(key, parseInt(btn.dataset.index));
            renderTodayReminders();
            renderCalendar();
        });
    });
}

//  LINHA DO TEMPO
function getTaskStatus(key, reminder) {
    if (reminder.done) return "done";
    if (isToday(key)) return "pending";
    if (isPast(key)) return "missed";
    return "pending";
}

function renderTimeline() {
    timelineBody.innerHTML = "";

    // Agrupa todos os lembretes por data, ordenados
    const allKeys = Object.keys(reminders)
        .filter((k) => reminders[k].length > 0)
        .sort();

    if (allKeys.length === 0) {
        timelineBody.innerHTML =
            '<p class="timeline-empty">Nenhuma tarefa encontrada. Adicione lembretes no calendário!</p>';
        return;
    }

    // Filtra por status se necessário
    const filtered = allKeys.filter((key) => {
        const tasks = reminders[key];
        if (currentFilter === "all") return true;
        return tasks.some((r) => getTaskStatus(key, r) === currentFilter);
    });

    if (filtered.length === 0) {
        const labels = {
            done: "concluídas",
            pending: "pendentes",
            missed: "não feitas",
        };
        timelineBody.innerHTML = `<p class="timeline-empty">Nenhuma tarefa ${labels[currentFilter]} encontrada.</p>`;
        return;
    }

    filtered.forEach((key, index) => {
        const { day, month, year, weekday } = formatDateLabel(key);
        const tasks = reminders[key];
        const todayMark = isToday(key);

        // Filtra tarefas pelo filtro ativo
        const visibleTasks =
            currentFilter === "all"
                ? tasks
                : tasks.filter((r) => getTaskStatus(key, r) === currentFilter);

        if (visibleTasks.length === 0) return;

        // Calcula status dominante do dia para cor da bolinha
        const allDone = tasks.every((r) => r.done);
        const anyMissed = tasks.some((r) => getTaskStatus(key, r) === "missed");
        const anyPending = tasks.some(
            (r) => getTaskStatus(key, r) === "pending",
        );
        let dayStatus = allDone ? "done" : anyMissed ? "missed" : "pending";

        const group = document.createElement("div");
        group.className = "tl-group";
        group.innerHTML = `
            <div class="tl-left">
                <div class="tl-dot tl-dot-${dayStatus}">
                    ${dayStatus === "done" ? "✅" : dayStatus === "missed" ? "❌" : "⏳"}
                </div>
                ${index < filtered.length - 1 ? '<div class="tl-line"></div>' : ""}
            </div>
            <div class="tl-card ${todayMark ? "tl-card-today" : ""}">
                <div class="tl-card-header">
                    <div class="tl-date-block">
                        <span class="tl-weekday">${weekday}${todayMark ? " — HOJE" : ""}</span>
                        <span class="tl-date">${day} de ${month} de ${year}</span>
                    </div>
                    <div class="tl-day-badges">
                        ${
                            tasks.filter((r) => r.done).length > 0
                                ? `<span class="tl-badge tl-badge-done">${tasks.filter((r) => r.done).length} feita${tasks.filter((r) => r.done).length > 1 ? "s" : ""}</span>`
                                : ""
                        }
                        ${
                            tasks.filter(
                                (r) => getTaskStatus(key, r) === "pending",
                            ).length > 0
                                ? `<span class="tl-badge tl-badge-pending">${tasks.filter((r) => getTaskStatus(key, r) === "pending").length} pendente${tasks.filter((r) => getTaskStatus(key, r) === "pending").length > 1 ? "s" : ""}</span>`
                                : ""
                        }
                        ${
                            tasks.filter(
                                (r) => getTaskStatus(key, r) === "missed",
                            ).length > 0
                                ? `<span class="tl-badge tl-badge-missed">${tasks.filter((r) => getTaskStatus(key, r) === "missed").length} não feita${tasks.filter((r) => getTaskStatus(key, r) === "missed").length > 1 ? "s" : ""}</span>`
                                : ""
                        }
                    </div>
                </div>
                <div class="tl-tasks">
                    ${visibleTasks
                        .map((r) => {
                            const status = getTaskStatus(key, r);
                            return `
                        <div class="tl-task tl-task-${status}">
                            <span class="tl-task-icon">
                                ${status === "done" ? "✅" : status === "missed" ? "❌" : "⏳"}
                            </span>
                            <span class="tl-task-text">${r.text}</span>
                            <span class="tl-task-status-label tl-label-${status}">
                                ${status === "done" ? "Feito!" : status === "missed" ? "Não feita" : "Pendente"}
                            </span>
                        </div>`;
                        })
                        .join("")}
                </div>
            </div>
        `;
        timelineBody.appendChild(group);
    });
}

//  FILTROS DA TIMELINE
document.querySelectorAll(".filter-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
        document
            .querySelectorAll(".filter-btn")
            .forEach((b) => b.classList.remove("active"));
        btn.classList.add("active");
        currentFilter = btn.dataset.filter;
        renderTimeline();
    });
});

//  MODAL
function openModal(year, month, day) {
    selectedDateKey = dateKey(year, month, day);
    const monthNames = [
        "Janeiro",
        "Fevereiro",
        "Março",
        "Abril",
        "Maio",
        "Junho",
        "Julho",
        "Agosto",
        "Setembro",
        "Outubro",
        "Novembro",
        "Dezembro",
    ];
    modalDateTitle.textContent = `📅 ${day} de ${monthNames[month]} de ${year}`;
    reminderInput.value = "";
    renderModalReminders();
    modalOverlay.classList.add("active");
    setTimeout(() => reminderInput.focus(), 100);
}

function closeModal() {
    modalOverlay.classList.remove("active");
    selectedDateKey = null;
    renderTodayReminders();
    renderCalendar();
}

function renderModalReminders() {
    const list = reminders[selectedDateKey] || [];
    modalReminders.innerHTML = "";
    if (list.length === 0) {
        modalReminders.innerHTML =
            '<p class="no-reminders-modal">Nenhum lembrete para este dia.</p>';
        return;
    }
    list.forEach((r, i) => {
        const item = document.createElement("div");
        item.className = "reminder-item" + (r.done ? " done" : "");
        item.innerHTML = `
            <span class="reminder-text">${r.text}</span>
            <div class="reminder-actions">
                ${
                    !r.done
                        ? `<button class="btn-done" data-index="${i}">✔ Concluir</button>`
                        : `<span class="done-tag">✅ Feito!</span>`
                }
                <button class="btn-delete" data-index="${i}">🗑</button>
            </div>
        `;
        modalReminders.appendChild(item);
    });
    modalReminders.querySelectorAll(".btn-done").forEach((btn) => {
        btn.addEventListener("click", () => {
            confirmReminder(selectedDateKey, parseInt(btn.dataset.index));
            renderModalReminders();
            updateMissions();
        });
    });
    modalReminders.querySelectorAll(".btn-delete").forEach((btn) => {
        btn.addEventListener("click", () => {
            reminders[selectedDateKey].splice(parseInt(btn.dataset.index), 1);
            renderModalReminders();
            updateMissions();
            renderTodayReminders();
            renderCalendar();
        });
    });
}

function confirmReminder(key, index) {
    if (!reminders[key] || reminders[key][index].done) return;
    reminders[key][index].done = true;
    addXP(XP_PER_REMINDER);
    showToast(`+${XP_PER_REMINDER} XP! Lembrete concluído 🎯`);
    if (viewTimeline.style.display !== "none") renderTimeline();
}

function addReminder() {
    const text = reminderInput.value.trim();
    if (!text) return;
    if (!reminders[selectedDateKey]) reminders[selectedDateKey] = [];
    reminders[selectedDateKey].push({ text, done: false });
    reminderInput.value = "";
    renderModalReminders();
    renderCalendar();
    updateMissions();
    renderTodayReminders();
    syncTimelinePanel();
    showToast("Lembrete adicionado! 📌", "info");
}

//  CALENDÁRIO
function renderCalendar() {
    calendarDaysEl.innerHTML = "";
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const monthNames = [
        "Janeiro",
        "Fevereiro",
        "Março",
        "Abril",
        "Maio",
        "Junho",
        "Julho",
        "Agosto",
        "Setembro",
        "Outubro",
        "Novembro",
        "Dezembro",
    ];
    monthYearElement.innerText = `${monthNames[month]} ${year}`;

    const firstDayIndex = new Date(year, month, 1).getDay();
    const lastDay = new Date(year, month + 1, 0).getDate();

    for (let i = 0; i < firstDayIndex; i++) {
        const e = document.createElement("div");
        e.classList.add("day", "empty");
        calendarDaysEl.appendChild(e);
    }

    for (let day = 1; day <= lastDay; day++) {
        const el = document.createElement("div");
        const key = dateKey(year, month, day);
        const dayReminders = reminders[key] || [];
        el.classList.add("day");

        const span = document.createElement("span");
        span.textContent = day;
        el.appendChild(span);

        if (dayReminders.length > 0) {
            const dot = document.createElement("span");
            dot.classList.add("reminder-dot");
            const allDone = dayReminders.every((r) => r.done);
            dot.classList.add(allDone ? "dot-done" : "dot-pending");
            el.appendChild(dot);
        }

        const today = new Date();
        if (
            day === today.getDate() &&
            month === today.getMonth() &&
            year === today.getFullYear()
        ) {
            el.classList.add("today");
        }

        el.addEventListener("click", () => openModal(year, month, day));
        calendarDaysEl.appendChild(el);
    }
}

//  EVENTOS
prevBtn.addEventListener("click", () => {
    currentDate.setMonth(currentDate.getMonth() - 1);
    renderCalendar();
});
nextBtn.addEventListener("click", () => {
    currentDate.setMonth(currentDate.getMonth() + 1);
    renderCalendar();
});
modalClose.addEventListener("click", closeModal);
modalOverlay.addEventListener("click", (e) => {
    if (e.target === modalOverlay) closeModal();
});
btnAddReminder.addEventListener("click", addReminder);
reminderInput.addEventListener("keydown", (e) => {
    if (e.key === "Enter") addReminder();
});

//  INIT
renderCalendar();
updateMissions();
renderTodayReminders();
syncTimelinePanel();
