/**
 * app.js - 主逻辑
 */

let currentCategory = "all";
let peopleCount = 3;
let currentRandomMenu = null;
let selectedDishes = new Set(); // 手动选中的菜品名称集合

const ALL_CATEGORIES = ["seafood","stirfry","chopped","veggie","soup","staple","combo"];

// ===== 初始化 =====
document.addEventListener("DOMContentLoaded", () => {
    renderStats();
    renderMenu();
    bindEvents();
});

// ===== 渲染统计横幅 =====
function renderStats() {
    const banner = document.getElementById("statsBanner");
    const total = DISHES.length;
    let html = `<div class="stat-chip">📊 共 <span class="stat-num">${total}</span> 道菜</div>`;
    ALL_CATEGORIES.forEach(key => {
        const cat = CATEGORIES[key];
        const count = DISHES.filter(d => d.category === key).length;
        html += `<div class="stat-chip">${cat.emoji} ${cat.name} <span class="stat-num">${count}</span></div>`;
    });
    banner.innerHTML = html;
}

// ===== 渲染菜品卡片 =====
function renderMenu(filter = "") {
    const container = document.getElementById("menuContainer");
    const noResult = document.getElementById("noResult");
    container.innerHTML = "";

    const keyword = filter.trim().toLowerCase();
    let totalShown = 0;

    ALL_CATEGORIES.forEach(catKey => {
        const cat = CATEGORIES[catKey];
        let dishes = DISHES.filter(d => d.category === catKey);

        if (currentCategory !== "all" && currentCategory !== catKey) return;

        if (keyword) {
            dishes = dishes.filter(d => d.name.includes(keyword)
                || d.ingredients.includes(keyword));
        }
        if (dishes.length === 0) return;

        const header = document.createElement("div");
        header.className = "category-header";
        header.innerHTML = `<span class="cat-dot" style="background:${cat.color}"></span>
            ${cat.emoji} ${cat.name}（${dishes.length}道）`;
        container.appendChild(header);

        dishes.forEach(dish => {
            const isSelected = selectedDishes.has(dish.name);
            const card = document.createElement("div");
            card.className = "dish-card" + (isSelected ? " selected" : "");
            card.setAttribute("data-name", dish.name);
            card.onclick = () => showDetail(dish);
            card.innerHTML = `
                <div class="card-emoji-bg" style="background:linear-gradient(135deg, ${cat.color}18, ${cat.color}08)">
                    <button class="card-select-btn" onclick="event.stopPropagation();event.preventDefault();toggleSelect('${dish.name.replace(/'/g, "\\'")}')">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
                    </button>
                    <span>${dish.emoji}</span>
                </div>
                <div class="card-body">
                    <h3>${highlightKeyword(dish.name, keyword)}</h3>
                    <div class="card-meta">
                        <span class="card-category-tag" style="background:${cat.color}18;color:${cat.color}">${cat.name}</span>
                        <span class="card-kcal">🔥${dish.kcal}</span>
                    </div>
                </div>`;
            container.appendChild(card);
            totalShown++;
        });
    });

    noResult.style.display = totalShown === 0 ? "block" : "none";
}

function highlightKeyword(text, keyword) {
    if (!keyword) return text;
    const idx = text.toLowerCase().indexOf(keyword);
    if (idx === -1) return text;
    return text.slice(0, idx)
        + `<mark style="background:#ffe0b2;border-radius:2px;padding:0 1px">${text.slice(idx, idx + keyword.length)}</mark>`
        + text.slice(idx + keyword.length);
}

// ===== 手动选菜逻辑 =====
function toggleSelect(dishName) {
    if (selectedDishes.has(dishName)) {
        selectedDishes.delete(dishName);
    } else {
        selectedDishes.add(dishName);
    }
    updateSelectionBar();
    // 用 data-name 精确匹配，避免移动端状态不同步
    document.querySelectorAll(".dish-card").forEach(card => {
        const name = card.getAttribute("data-name");
        if (name) {
            card.classList.toggle("selected", selectedDishes.has(name));
        }
    });
}

function updateSelectionBar() {
    const bar = document.getElementById("selectionBar");
    const count = selectedDishes.size;
    if (count === 0) {
        bar.style.display = "none";
        document.body.classList.remove("has-selection");
        return;
    }
    bar.style.display = "block";
    document.body.classList.add("has-selection");
    document.getElementById("selectionCount").textContent = count;
    const totalKcal = getSelectedDishes().reduce((sum, d) => sum + d.kcal, 0);
    document.getElementById("selectionKcal").textContent = `🔥 ${totalKcal} kcal`;
}

function getSelectedDishes() {
    return DISHES.filter(d => selectedDishes.has(d.name));
}

function clearSelection() {
    selectedDishes.clear();
    updateSelectionBar();
    // 强制清除所有卡片的选中状态
    document.querySelectorAll(".dish-card").forEach(c => c.classList.remove("selected"));
}

function confirmSelection() {
    const dishes = getSelectedDishes();
    if (dishes.length === 0) return;
    showShareModal(dishes);
}

// ===== 事件绑定 =====
function bindEvents() {
    const searchInput = document.getElementById("searchInput");
    const clearBtn = document.getElementById("clearSearch");
    searchInput.addEventListener("input", () => {
        clearBtn.style.display = searchInput.value ? "block" : "none";
        renderMenu(searchInput.value);
    });
    clearBtn.addEventListener("click", () => {
        searchInput.value = "";
        clearBtn.style.display = "none";
        renderMenu();
    });

    document.querySelectorAll(".cat-tab").forEach(tab => {
        tab.addEventListener("click", () => {
            document.querySelectorAll(".cat-tab").forEach(t => t.classList.remove("active"));
            tab.classList.add("active");
            currentCategory = tab.dataset.category;
            renderMenu(searchInput.value);
        });
    });

    document.getElementById("randomBtn").addEventListener("click", openRandomModal);

    window.addEventListener("scroll", () => {
        document.getElementById("backToTop").style.display = window.scrollY > 400 ? "block" : "none";
    });

    ["randomModal", "detailModal", "shareModal"].forEach(id => {
        document.getElementById(id).addEventListener("click", e => {
            if (e.target === e.currentTarget) {
                document.getElementById(id).style.display = "none";
            }
        });
    });
}

// ===== 随机点餐逻辑 =====
function openRandomModal() {
    document.getElementById("randomModal").style.display = "flex";
    document.getElementById("randomResult").style.display = "none";
    document.querySelectorAll(".people-btn").forEach((btn, i) => {
        btn.classList.toggle("active", i + 2 === peopleCount);
    });
}
function closeRandomModal() {
    document.getElementById("randomModal").style.display = "none";
}

function setPeople(n) {
    peopleCount = n;
    document.querySelectorAll(".people-btn").forEach((btn, i) => {
        btn.classList.toggle("active", i + 2 === n);
    });
}

function generateMenu() {
    const seafood = DISHES.filter(d => d.category === "seafood");
    const stirfry = DISHES.filter(d => d.category === "stirfry");
    const chopped = DISHES.filter(d => d.category === "chopped");
    const veggies = DISHES.filter(d => d.category === "veggie");
    const soups   = DISHES.filter(d => d.category === "soup");
    const staples = DISHES.filter(d => d.category === "staple");
    const combos  = DISHES.filter(d => d.category === "combo");

    let selected = [];
    const n = peopleCount;

    if (n <= 5 && Math.random() < 0.3) {
        const pool = [...combos, ...staples];
        const pick = pool[Math.floor(Math.random() * pool.length)];
        selected = [pick];
        if (pick.category === "combo") {
            selected.push(randomPick(soups));
        }
    } else {
        const meatCount = n - 1;
        let remaining = meatCount;

        if (remaining > 0 && Math.random() < 0.6) {
            selected.push(randomPick(seafood));
            remaining--;
        }
        if (remaining > 0 && Math.random() < 0.5) {
            selected.push(randomPick(chopped));
            remaining--;
        }
        while (remaining > 0) {
            const pick = randomPick(stirfry);
            if (!selected.find(s => s.name === pick.name)) {
                selected.push(pick);
                remaining--;
            }
        }
        selected.push(randomPick(veggies));
        selected.push(randomPick(soups));
    }

    currentRandomMenu = selected;
    showRandomResult(selected);
}

function randomPick(arr) {
    return arr[Math.floor(Math.random() * arr.length)];
}

function showRandomResult(dishes) {
    const container = document.getElementById("randomResult");
    container.style.display = "block";

    const isSingleCombo = dishes.length <= 2 && dishes[0].category === "combo";
    const isSingleStaple = dishes.length === 1 && dishes[0].category === "staple";
    const totalKcal = dishes.reduce((sum, d) => sum + d.kcal, 0);

    let title;
    if (isSingleCombo || isSingleStaple) {
        title = `🎉 今天就吃这个！（${peopleCount}人餐）`;
    } else {
        const soupCount = dishes.filter(d => d.category === "soup").length;
        const dishCount = dishes.length - soupCount;
        title = `🎉 ${peopleCount}人餐 · ${dishCount}菜${soupCount}汤`;
    }

    let html = `<h3>${title}</h3>`;
    dishes.forEach(d => {
        const cat = CATEGORIES[d.category];
        html += `<div class="result-dish">
            <span class="r-emoji">${d.emoji}</span>
            <span class="r-name">${d.name}</span>
            <span class="r-kcal">🔥${d.kcal}</span>
            <span class="r-cat" style="background:${cat.color}">${cat.name}</span>
        </div>`;
    });
    html += `<div class="result-total-kcal">总热量约 <strong>${totalKcal} kcal</strong></div>`;
    html += `<div class="result-actions">
        <button class="reroll-btn" onclick="generateMenu()">🎲 换一组</button>
        <button class="confirm-btn" onclick="confirmMenu()">✅ 就这个了</button>
    </div>`;
    container.innerHTML = html;
    container.scrollIntoView({ behavior: "smooth", block: "nearest" });
}

function confirmMenu() {
    if (!currentRandomMenu) return;
    closeRandomModal();
    showShareModal(currentRandomMenu);
}

// ===== 分享菜单 =====
function showShareModal(dishes) {
    const now = new Date();
    const dateStr = `${now.getFullYear()}年${now.getMonth()+1}月${now.getDate()}日`;
    const weekDays = ["日","一","二","三","四","五","六"];
    const dayStr = `星期${weekDays[now.getDay()]}`;
    const totalKcal = dishes.reduce((sum, d) => sum + d.kcal, 0);

    let text = `🍽️ 今天吃什么\n`;
    text += `📅 ${dateStr} ${dayStr}\n`;
    text += `${"─".repeat(16)}\n`;
    dishes.forEach(d => {
        const cat = CATEGORIES[d.category];
        text += `${d.emoji} ${d.name}（${cat.name}）${d.kcal}kcal\n`;
    });
    text += `${"─".repeat(16)}\n`;
    text += `🔥 总热量约 ${totalKcal} kcal\n`;
    text += `✨ 来自「今天吃什么」点餐助手`;

    document.getElementById("shareContent").textContent = text;
    document.getElementById("shareModal").style.display = "flex";
    document.getElementById("shareHint").style.display = "none";

    const nativeBtn = document.querySelector(".native-share-btn");
    if (!navigator.share) {
        nativeBtn.textContent = "📤 无法直接分享（请复制后粘贴）";
        nativeBtn.style.opacity = "0.6";
    } else {
        nativeBtn.textContent = "📤 分享到微信/其他";
        nativeBtn.style.opacity = "1";
    }
}

function closeShareModal() {
    document.getElementById("shareModal").style.display = "none";
}

function copyMenu() {
    const text = document.getElementById("shareContent").textContent;
    navigator.clipboard.writeText(text).then(() => {
        showShareHint("✅ 已复制到剪贴板，去微信粘贴吧！");
    }).catch(() => {
        const ta = document.createElement("textarea");
        ta.value = text;
        document.body.appendChild(ta);
        ta.select();
        document.execCommand("copy");
        document.body.removeChild(ta);
        showShareHint("✅ 已复制到剪贴板！");
    });
}

function nativeShare() {
    const text = document.getElementById("shareContent").textContent;
    if (navigator.share) {
        navigator.share({ title: "今天吃什么", text: text }).catch(() => {});
    } else {
        copyMenu();
    }
}

function showShareHint(msg) {
    const hint = document.getElementById("shareHint");
    hint.textContent = msg;
    hint.style.display = "block";
    setTimeout(() => { hint.style.display = "none"; }, 3000);
}

// ===== 菜品详情弹窗 =====
function showDetail(dish) {
    const cat = CATEGORIES[dish.category];
    document.getElementById("detailTitle").textContent = `${dish.emoji} ${dish.name}`;
    document.getElementById("detailEmoji").textContent = dish.emoji;
    document.getElementById("detailEmoji").style.background =
        `linear-gradient(135deg, ${cat.color}15, ${cat.color}08)`;
    document.getElementById("detailEmoji").style.borderRadius = "16px";
    document.getElementById("detailIngredients").textContent = dish.ingredients;

    const stepsContainer = document.getElementById("detailSteps");
    stepsContainer.innerHTML = dish.steps.split("\n").map(s =>
        `<div class="step">${s}</div>`
    ).join("");

    document.getElementById("detailModal").style.display = "flex";
}

function closeDetailModal() {
    document.getElementById("detailModal").style.display = "none";
}
