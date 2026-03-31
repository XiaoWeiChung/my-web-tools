/**
 * AI 导航站 - 主逻辑
 */

// ===== 状态 =====
let currentCategory = 'all';
let searchQuery = '';
let priceFilter = 'all';
let sortFilter = 'rating';

// ===== DOM 引用 =====
const $ = (sel) => document.querySelector(sel);
const $$ = (sel) => document.querySelectorAll(sel);

// ===== 初始化 =====
document.addEventListener('DOMContentLoaded', () => {
    renderStats();
    renderCategories();
    renderFeatured();
    renderTools();
    bindEvents();
    loadTheme();
});

// ===== 统计数据 =====
function renderStats() {
    const total = AI_TOOLS.length;
    const cats = CATEGORIES.length - 1; // 减去"全部"
    const free = AI_TOOLS.filter(t => t.price === 'free').length;
    animateNumber($('#totalTools'), total);
    animateNumber($('#totalCategories'), cats);
    animateNumber($('#freeCount'), free);
}

function animateNumber(el, target) {
    let current = 0;
    const step = Math.ceil(target / 30);
    const timer = setInterval(() => {
        current += step;
        if (current >= target) {
            current = target;
            clearInterval(timer);
        }
        el.textContent = current;
    }, 30);
}

// ===== 分类标签 =====
function renderCategories() {
    const container = $('#categoryTabs');
    container.innerHTML = CATEGORIES.map(cat => {
        const count = cat.id === 'all' ? AI_TOOLS.length : AI_TOOLS.filter(t => t.category === cat.id).length;
        return `<button class="cat-tab ${cat.id === currentCategory ? 'active' : ''}" data-cat="${cat.id}">
            ${cat.icon} ${cat.name} <span style="opacity:0.6;font-size:11px">${count}</span>
        </button>`;
    }).join('');

    // 提交弹窗的分类下拉
    const select = $('#toolCategory');
    if (select) {
        select.innerHTML = CATEGORIES.filter(c => c.id !== 'all').map(c =>
            `<option value="${c.id}">${c.icon} ${c.name}</option>`
        ).join('');
    }
}

// ===== 今日推荐 =====
function renderFeatured() {
    const hotTools = AI_TOOLS.filter(t => t.isHot || t.isNew);
    // 随机选 3 个
    const shuffled = [...hotTools].sort(() => Math.random() - 0.5);
    const featured = shuffled.slice(0, 3);

    $('#featuredGrid').innerHTML = featured.map((tool, i) => `
        <div class="featured-card animate-in" style="animation-delay:${i * 0.1}s" data-tool="${tool.name}">
            <div class="featured-top">
                <div class="featured-icon">${tool.icon}</div>
                <div class="featured-badges">
                    ${tool.isHot ? '<span class="badge badge-hot">🔥 热门</span>' : ''}
                    ${tool.isNew ? '<span class="badge badge-new">✨ 新上线</span>' : ''}
                    <span class="badge badge-${tool.price}">${priceLabel(tool.price)}</span>
                </div>
            </div>
            <div class="featured-name">${tool.name}</div>
            <div class="featured-desc">${tool.desc}</div>
            <div class="featured-footer">
                <div class="featured-rating">
                    <span class="stars">${renderStars(tool.rating)}</span>
                    <span>${tool.rating}</span>
                </div>
                <div class="featured-tags">
                    ${tool.tags.slice(0, 2).map(t => `<span class="tag">${t}</span>`).join('')}
                </div>
            </div>
        </div>
    `).join('');
}

// ===== 工具列表 =====
function renderTools() {
    let tools = [...AI_TOOLS];

    // 分类筛选
    if (currentCategory !== 'all') {
        tools = tools.filter(t => t.category === currentCategory);
    }

    // 搜索
    if (searchQuery) {
        const q = searchQuery.toLowerCase();
        tools = tools.filter(t =>
            t.name.toLowerCase().includes(q) ||
            t.desc.toLowerCase().includes(q) ||
            t.tags.some(tag => tag.toLowerCase().includes(q))
        );
    }

    // 价格筛选
    if (priceFilter !== 'all') {
        tools = tools.filter(t => t.price === priceFilter);
    }

    // 排序
    if (sortFilter === 'rating') {
        tools.sort((a, b) => b.rating - a.rating);
    } else if (sortFilter === 'name') {
        tools.sort((a, b) => a.name.localeCompare(b.name));
    } else if (sortFilter === 'new') {
        tools.sort((a, b) => (b.isNew ? 1 : 0) - (a.isNew ? 1 : 0));
    }

    const grid = $('#toolsGrid');
    const empty = $('#emptyState');

    if (tools.length === 0) {
        grid.style.display = 'none';
        empty.style.display = 'block';
        return;
    }

    grid.style.display = 'grid';
    empty.style.display = 'none';

    grid.innerHTML = tools.map((tool, i) => `
        <div class="tool-card animate-in" style="animation-delay:${Math.min(i * 0.04, 0.5)}s" data-tool="${tool.name}">
            <div class="tool-top">
                <div class="tool-icon">${tool.icon}</div>
                <div class="tool-info">
                    <div class="tool-name">
                        ${tool.name}
                        ${tool.isNew ? ' <span class="badge badge-new" style="font-size:10px;vertical-align:middle">NEW</span>' : ''}
                    </div>
                    <div class="tool-meta">
                        <span class="tool-rating"><span class="stars">${renderStars(tool.rating)}</span> ${tool.rating}</span>
                        <span class="tool-price-tag badge badge-${tool.price}">${priceLabel(tool.price)}</span>
                    </div>
                </div>
            </div>
            <div class="tool-desc">${highlightSearch(tool.desc)}</div>
            <div class="tool-tags">
                ${tool.tags.map(t => `<span class="tag">${t}</span>`).join('')}
            </div>
        </div>
    `).join('');
}

// ===== 工具详情 =====
function showDetail(toolName) {
    const tool = AI_TOOLS.find(t => t.name === toolName);
    if (!tool) return;

    const cat = CATEGORIES.find(c => c.id === tool.category);

    $('#detailContent').innerHTML = `
        <div class="detail-header">
            <div class="detail-icon">${tool.icon}</div>
            <div>
                <div class="detail-title">${tool.name}</div>
                <div class="detail-subtitle">${cat ? cat.icon + ' ' + cat.name : ''}</div>
            </div>
        </div>
        <div class="detail-desc">${tool.desc}</div>
        <div class="detail-info">
            <div class="detail-info-item">
                <div class="detail-info-label">评分</div>
                <div class="detail-info-value"><span class="stars">${renderStars(tool.rating)}</span> ${tool.rating}</div>
            </div>
            <div class="detail-info-item">
                <div class="detail-info-label">价格</div>
                <div class="detail-info-value">${priceLabel(tool.price)}</div>
            </div>
        </div>
        <div class="detail-tags">
            ${tool.tags.map(t => `<span class="tag">${t}</span>`).join('')}
            ${tool.isHot ? '<span class="badge badge-hot">🔥 热门</span>' : ''}
            ${tool.isNew ? '<span class="badge badge-new">✨ 新上线</span>' : ''}
        </div>
        <a href="${tool.url}" target="_blank" rel="noopener" class="btn-visit">🔗 访问 ${tool.name}</a>
    `;

    $('#detailModal').classList.add('active');
}

// ===== 事件绑定 =====
function bindEvents() {
    // 搜索
    let searchTimer;
    $('#searchInput').addEventListener('input', (e) => {
        clearTimeout(searchTimer);
        searchTimer = setTimeout(() => {
            searchQuery = e.target.value.trim();
            renderTools();
        }, 200);
    });

    // 快捷键 / 聚焦搜索
    document.addEventListener('keydown', (e) => {
        if (e.key === '/' && document.activeElement.tagName !== 'INPUT' && document.activeElement.tagName !== 'TEXTAREA') {
            e.preventDefault();
            $('#searchInput').focus();
        }
        if (e.key === 'Escape') {
            $('#submitModal').classList.remove('active');
            $('#detailModal').classList.remove('active');
        }
    });

    // 分类切换
    $('#categoryTabs').addEventListener('click', (e) => {
        const tab = e.target.closest('.cat-tab');
        if (!tab) return;
        currentCategory = tab.dataset.cat;
        $$('.cat-tab').forEach(t => t.classList.remove('active'));
        tab.classList.add('active');
        renderTools();
    });

    // 价格筛选
    $('#priceFilter').addEventListener('change', (e) => {
        priceFilter = e.target.value;
        renderTools();
    });

    // 排序
    $('#sortFilter').addEventListener('change', (e) => {
        sortFilter = e.target.value;
        renderTools();
    });

    // 换一批推荐
    $('#refreshFeatured').addEventListener('click', renderFeatured);

    // 工具卡片点击
    document.addEventListener('click', (e) => {
        const card = e.target.closest('[data-tool]');
        if (card) showDetail(card.dataset.tool);
    });

    // 提交弹窗
    $('#submitBtn').addEventListener('click', () => $('#submitModal').classList.add('active'));
    $('#closeModal').addEventListener('click', () => $('#submitModal').classList.remove('active'));
    $('#closeDetail').addEventListener('click', () => $('#detailModal').classList.remove('active'));

    // 点击遮罩关闭
    $$('.modal-overlay').forEach(overlay => {
        overlay.addEventListener('click', (e) => {
            if (e.target === overlay) overlay.classList.remove('active');
        });
    });

    // 提交表单
    $('#submitForm').addEventListener('submit', (e) => {
        e.preventDefault();
        const newTool = {
            name: $('#toolName').value,
            url: $('#toolUrl').value,
            desc: $('#toolDesc').value,
            category: $('#toolCategory').value,
            price: $('#toolPrice').value,
            icon: '🆕',
            rating: 0,
            tags: ['用户提交'],
            isNew: true,
        };
        AI_TOOLS.push(newTool);
        $('#submitModal').classList.remove('active');
        $('#submitForm').reset();
        renderStats();
        renderCategories();
        renderTools();
        showToast('提交成功，感谢分享！');
    });

    // 清除筛选
    $('#resetBtn').addEventListener('click', () => {
        searchQuery = '';
        currentCategory = 'all';
        priceFilter = 'all';
        $('#searchInput').value = '';
        $('#priceFilter').value = 'all';
        renderCategories();
        renderTools();
    });

    // 主题切换
    $('#themeBtn').addEventListener('click', toggleTheme);

    // 回到顶部
    const backBtn = $('#backToTop');
    window.addEventListener('scroll', () => {
        backBtn.classList.toggle('visible', window.scrollY > 400);
    });
    backBtn.addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' }));

    // Logo 点击回顶部
    $('.logo').addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' }));
}

// ===== 主题 =====
function toggleTheme() {
    const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
    document.documentElement.setAttribute('data-theme', isDark ? 'light' : 'dark');
    $('#themeBtn').textContent = isDark ? '🌙' : '☀️';
    localStorage.setItem('ai-nav-theme', isDark ? 'light' : 'dark');
}

function loadTheme() {
    const saved = localStorage.getItem('ai-nav-theme');
    if (saved === 'dark' || (!saved && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
        document.documentElement.setAttribute('data-theme', 'dark');
        $('#themeBtn').textContent = '☀️';
    }
}

// ===== 工具函数 =====
function renderStars(rating) {
    const full = Math.floor(rating);
    const half = rating % 1 >= 0.5 ? 1 : 0;
    const empty = 5 - full - half;
    return '★'.repeat(full) + (half ? '½' : '') + '☆'.repeat(empty);
}

function priceLabel(price) {
    const map = { free: '免费', freemium: '免费增值', paid: '付费' };
    return map[price] || price;
}

function highlightSearch(text) {
    if (!searchQuery) return text;
    const regex = new RegExp(`(${searchQuery.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
    return text.replace(regex, '<mark style="background:var(--primary-bg);color:var(--primary);border-radius:2px;padding:0 2px">$1</mark>');
}

function showToast(msg) {
    const toast = document.createElement('div');
    toast.textContent = msg;
    Object.assign(toast.style, {
        position: 'fixed',
        bottom: '80px',
        left: '50%',
        transform: 'translateX(-50%)',
        padding: '12px 24px',
        background: 'var(--primary)',
        color: 'white',
        borderRadius: '12px',
        fontSize: '14px',
        fontWeight: '600',
        boxShadow: '0 4px 16px rgba(108,92,231,0.3)',
        zIndex: '300',
        animation: 'fadeInUp 0.3s ease-out',
        fontFamily: 'var(--font)',
    });
    document.body.appendChild(toast);
    setTimeout(() => {
        toast.style.opacity = '0';
        toast.style.transition = '0.3s';
        setTimeout(() => toast.remove(), 300);
    }, 2000);
}
