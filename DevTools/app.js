/**
 * 开发者工具箱 - DevToolKit
 */

// ===== 工具注册表 =====
const TOOLS = [
    { id: 'json', name: 'JSON 格式化', icon: '📋', group: '编码转换', desc: 'JSON 美化/压缩/校验', color: '#6366f1',
      detail: '将杂乱的 JSON 字符串格式化为易读的缩进格式，或压缩为单行。同时校验 JSON 语法是否正确。',
      examples: ['接口返回的 JSON 数据太长看不清，一键格式化', '上线前把 JSON 配置压缩成一行减小体积', '检查手写的 JSON 有没有语法错误（少逗号、多括号等）'] },
    { id: 'base64', name: 'Base64 编解码', icon: '🔐', group: '编码转换', desc: '文本 Base64 编码解码', color: '#8b5cf6',
      detail: '将文本编码为 Base64 字符串，或将 Base64 字符串解码还原。常用于接口传参、邮件编码等场景。',
      examples: ['把中文参数编码后拼到 URL 里传给后端', '解码别人发来的 Base64 字符串看看内容是什么', '调试接口时对 Authorization header 进行编解码'] },
    { id: 'url', name: 'URL 编解码', icon: '🔗', group: '编码转换', desc: 'URL 编码解码转换', color: '#3b82f6',
      detail: '对 URL 中的特殊字符进行编码（如空格变 %20），或将编码后的 URL 还原为可读格式。',
      examples: ['链接里有中文或特殊符号需要编码后才能正常跳转', '看到一串 %E4%BD%A0%E5%A5%BD 想知道原文是什么', '拼接带参数的 URL 时对 value 进行编码'] },
    { id: 'unicode', name: 'Unicode 转换', icon: '🌐', group: '编码转换', desc: 'Unicode/中文互转', color: '#0ea5e9',
      detail: '将中文转为 \\uXXXX 格式的 Unicode 编码，或反向解码。常见于国际化文件和 JSON 转义。',
      examples: ['i18n 文件里看到 \\u4f60\\u597d 想知道是什么字', '把中文转成 Unicode 写进配置文件避免编码问题', '处理 JSON 里自动转义的中文字符'] },
    { id: 'hash', name: 'Hash 计算', icon: '🔒', group: '编码转换', desc: 'MD5/SHA1/SHA256 哈希', color: '#10b981',
      detail: '计算文本的哈希值，支持 SHA-1、SHA-256、SHA-384、SHA-512 算法。哈希是单向的，不可逆。',
      examples: ['生成密码的哈希值用于存储', '校验文件内容是否被篡改', '对接第三方 API 时需要对参数做签名'] },
    { id: 'jwt', name: 'JWT 解析', icon: '🎫', group: '编码转换', desc: '解析 JWT Token 内容', color: '#f59e0b',
      detail: '解析 JWT（JSON Web Token）的 Header 和 Payload 部分，查看其中的用户信息、过期时间等。',
      examples: ['登录后拿到 token 想看看里面存了什么信息', '检查 token 的过期时间（exp 字段）是否正确', '调试 OAuth 流程时查看 token 的签发者和权限'] },
    { id: 'regex', name: '正则测试', icon: '🎯', group: '文本处理', desc: '正则表达式在线测试', color: '#ef4444',
      detail: '在线测试正则表达式，实时高亮匹配结果，显示匹配数量。支持全局、忽略大小写等标志。',
      examples: ['写一个匹配手机号的正则：^1[3-9]\\d{9}$', '测试邮箱格式校验的正则是否正确', '从一段日志里提取所有 IP 地址'] },
    { id: 'diff', name: '文本对比', icon: '📊', group: '文本处理', desc: '两段文本差异对比', color: '#14b8a6',
      detail: '逐行对比两段文本的差异，用红色标记删除行、绿色标记新增行。快速找出改了哪里。',
      examples: ['对比两个版本的配置文件看改了什么', '检查同事改了哪几行代码', '对比两份合同文本的差异'] },
    { id: 'markdown', name: 'Markdown 预览', icon: '📝', group: '文本处理', desc: 'Markdown 实时渲染', color: '#6366f1',
      detail: '左侧输入 Markdown 源码，右侧实时渲染预览效果。支持标题、粗体、列表、代码块、引用等语法。',
      examples: ['写 README 时实时预览排版效果', '快速编辑一段 Markdown 格式的文档', '学习 Markdown 语法时边写边看效果'] },
    { id: 'textcount', name: '字数统计', icon: '🔢', group: '文本处理', desc: '字符/单词/行数统计', color: '#8b5cf6',
      detail: '统计文本的字符数、单词数、行数、中文字数、英文单词数、字节大小等多维度信息。',
      examples: ['写文章时看看字数够不够要求', '检查短信内容是否超过 70 个字', '统计代码文件有多少行'] },
    { id: 'case', name: '大小写转换', icon: '🔤', group: '文本处理', desc: '多种命名风格转换', color: '#f59e0b',
      detail: '在 camelCase、PascalCase、snake_case、kebab-case、UPPER CASE 等命名风格之间互转。',
      examples: ['把 user_name 转成 userName（后端字段转前端）', '把 getUserInfo 转成 get-user-info（URL 路径）', '把变量名转成 GET_USER_INFO（常量命名）'] },
    { id: 'timestamp', name: '时间戳转换', icon: '⏰', group: '日期时间', desc: '时间戳与日期互转', color: '#ef4444',
      detail: '将 Unix 时间戳转为可读日期，或将日期转为时间戳。支持秒级和毫秒级，实时显示当前时间戳。',
      examples: ['后端返回 1703980800 想知道是几月几号', '给接口传参需要把日期转成时间戳', '对比两个时间戳算时间差'] },
    { id: 'color', name: '颜色转换', icon: '🎨', group: '可视化', desc: 'HEX/RGB/HSL 互转', color: '#ec4899',
      detail: '在 HEX、RGB、RGBA、HSL 等颜色格式之间互转，还支持生成 OC UIColor 和 Swift Color 代码。',
      examples: ['设计师给了 #6366f1 想转成 rgb() 写 CSS', 'iOS 开发需要把 HEX 颜色转成 UIColor 代码', '调整颜色的色相/饱和度/亮度'] },
    { id: 'qrcode', name: '二维码生成', icon: '📱', group: '可视化', desc: '文本/链接生成二维码', color: '#10b981',
      detail: '将文本或链接生成二维码图片，可下载保存。适合分享链接、WiFi 密码等场景。',
      examples: ['把网站链接生成二维码贴到海报上', '生成 WiFi 密码二维码方便客人扫码连接', '把一段文字生成二维码用于线下扫码获取'] },
    { id: 'placeholder', name: '占位图生成', icon: '🖼️', group: '可视化', desc: '自定义尺寸占位图片', color: '#3b82f6',
      detail: '生成指定尺寸和颜色的占位图片，可自定义文字。前端开发时用来代替还没有的真实图片。',
      examples: ['页面开发时需要一张 400x300 的图片占位', '做原型时快速生成不同尺寸的色块', '生成带文字说明的占位图标注图片用途'] },
    { id: 'number', name: '进制转换', icon: '🔢', group: '数学计算', desc: '二/八/十/十六进制互转', color: '#f59e0b',
      detail: '在二进制、八进制、十进制、十六进制之间互相转换。',
      examples: ['把十进制 255 转成十六进制 FF', '看到二进制 11111111 想知道十进制是多少', '调试时把内存地址从十六进制转成十进制'] },
    { id: 'uuid', name: 'UUID 生成', icon: '🆔', group: '生成器', desc: '批量生成 UUID', color: '#6366f1',
      detail: '批量生成 UUID v4（随机），支持大写/小写、带横线/不带横线等格式选项。',
      examples: ['数据库需要一批 UUID 作为主键', '测试时需要生成一些唯一标识符', '生成不带横线的 UUID 用作文件名'] },
    { id: 'password', name: '密码生成', icon: '🔑', group: '生成器', desc: '随机安全密码生成', color: '#ef4444',
      detail: '使用加密安全的随机数生成器生成强密码，可自定义长度和字符类型（大小写、数字、符号）。',
      examples: ['注册新账号时生成一个 16 位强密码', '批量生成临时密码分发给团队成员', '生成只包含数字的 6 位验证码'] },
    { id: 'lorem', name: 'Lorem 文本', icon: '📄', group: '生成器', desc: '生成占位假文本', color: '#14b8a6',
      detail: '生成 Lorem Ipsum 占位文本（支持中英文），用于页面排版测试。可指定段落数量。',
      examples: ['前端开发时需要一些假文字填充页面', '测试文本溢出和换行效果', '生成中文假文本测试中文排版'] },
    { id: 'htmlescape', name: 'HTML/JS 转义', icon: '🛡️', group: '编码转换', desc: 'HTML 实体和 JS 字符串转义', color: '#0ea5e9',
      detail: '将 HTML 特殊字符（<、>、&、"）转为实体编码，或将文本转义为安全的 JS 字符串。防止 XSS 攻击。',
      examples: ['在页面上显示 <script> 标签的源码而不被执行', '把用户输入的内容转义后安全地插入 HTML', '生成转义后的 JS 字符串用于代码拼接'] },
    { id: 'cssunit', name: 'CSS 单位换算', icon: '📐', group: '前端工具', desc: 'px/rem/em/vw/vh 互转', color: '#8b5cf6',
      detail: '在 px、rem、em、vw、vh 等 CSS 单位之间互相转换。可自定义根字号和视口宽高。',
      examples: ['设计稿标注 32px 想转成 rem 写响应式', '算一下 100vw 在 375px 手机上是多少 px', '把 px 值批量转成 rem'] },
    { id: 'cron', name: 'Cron 表达式', icon: '⏱️', group: '日期时间', desc: '解析 Cron 定时任务表达式', color: '#f59e0b',
      detail: '解析 Cron 表达式为可读的中文描述，并计算接下来的执行时间。支持 5 位和 6 位格式。',
      examples: ['0 9 * * 1 表示每周一早上 9 点执行', '检查 */5 * * * * 是不是每 5 分钟执行一次', '写完 Cron 表达式验证一下下次执行时间对不对'] },
    { id: 'sql', name: 'SQL 格式化', icon: '🗃️', group: '文本处理', desc: 'SQL 语句美化格式化', color: '#3b82f6',
      detail: '将压缩在一行的 SQL 语句格式化为缩进清晰的多行格式，支持 SELECT、INSERT、UPDATE 等语句。',
      examples: ['后端日志里的 SQL 太长看不清，格式化一下', '代码审查时把同事写的长 SQL 格式化后再看', '把格式化好的 SQL 压缩成一行写进代码'] },
    { id: 'regexlib', name: '正则常用库', icon: '📚', group: '文本处理', desc: '常用正则表达式一键复制', color: '#ec4899',
      detail: '收录手机号、邮箱、身份证、URL、IP 地址等常用正则表达式，点击即可复制，附带说明和示例。',
      examples: ['忘了手机号的正则怎么写，直接复制', '需要一个校验邮箱格式的正则', '验证 IP 地址或 URL 格式'] },
    { id: 'pwdregex', name: '密码正则生成', icon: '🔐', group: '文本处理', desc: '自定义密码规则生成正则', color: '#6366f1',
      detail: '根据密码强度要求（长度、大小写、数字、特殊符号等）自动生成对应的正则表达式，并可实时测试。',
      examples: ['生成"8-20位，必须含大小写字母和数字"的正则', '生成"至少包含一个特殊符号"的密码校验', '快速测试密码是否符合自定义规则'] },
    { id: 'img2base64', name: '图片转 Base64', icon: '🖼️', group: '编码转换', desc: '图片转 Data URI 编码', color: '#10b981',
      detail: '将图片文件转为 Base64 编码的 Data URI，可直接嵌入 HTML/CSS 中，减少 HTTP 请求。',
      examples: ['小图标转成 base64 内联到 CSS 里', '邮件模板里嵌入图片不想用外链', '生成 data:image/png;base64,... 格式的字符串'] },
    { id: 'json2ts', name: 'JSON → TypeScript', icon: '🔷', group: '前端工具', desc: 'JSON 自动生成 TS 类型', color: '#3b82f6',
      detail: '粘贴 JSON 数据自动生成对应的 TypeScript interface 类型定义，支持嵌套对象和数组。',
      examples: ['后端给了 API 返回的 JSON，自动生成 TS 类型', '不想手写复杂的嵌套 interface', '快速为 JSON 配置文件生成类型定义'] },
    { id: 'httpcode', name: 'HTTP 状态码', icon: '📡', group: '速查手册', desc: 'HTTP 状态码含义速查', color: '#ef4444',
      detail: '速查所有 HTTP 状态码的含义、使用场景和常见原因。支持搜索和分类浏览。',
      examples: ['接口返回 403 想确认一下是什么意思', '纠结用 200 还是 201 还是 204', '查一下 502 和 504 的区别'] },
    { id: 'textdedup', name: '文本去重排序', icon: '🧹', group: '文本处理', desc: '多行文本去重/排序/过滤', color: '#14b8a6',
      detail: '对多行文本进行去重、排序（正序/倒序）、去空行、去首尾空格等批量处理。',
      examples: ['一份名单有重复的，去重后看看有多少人', '把一堆 IP 地址排序后去重', '清理日志中的重复行'] },
    { id: 'str2arr', name: '字符串 ↔ 数组', icon: '🔀', group: '文本处理', desc: '分隔字符串与数组互转', color: '#f59e0b',
      detail: '将逗号/换行分隔的字符串转为 JSON 数组，或将数组转为分隔字符串。支持自定义分隔符。',
      examples: ['把 "a,b,c" 转成 ["a","b","c"]', '把数组转成逗号分隔的字符串拼 SQL IN 条件', '换行分隔的列表转成 JSON 数组'] },
];

const $ = s => document.querySelector(s);
const $$ = s => document.querySelectorAll(s);

// ===== 初始化 =====
document.addEventListener('DOMContentLoaded', () => {
    renderSidebar();
    renderHome();
    bindGlobal();
    loadTheme();
});

// ===== 侧边栏 =====
function renderSidebar(filter = '') {
    const nav = $('#sidebarNav');
    const groups = {};
    TOOLS.forEach(t => {
        if (filter && !t.name.toLowerCase().includes(filter) && !t.desc.toLowerCase().includes(filter)) return;
        if (!groups[t.group]) groups[t.group] = [];
        groups[t.group].push(t);
    });
    nav.innerHTML = Object.entries(groups).map(([group, tools]) => `
        <div class="nav-group-title">${group}</div>
        ${tools.map(t => `
            <button class="nav-item" data-id="${t.id}">
                <span class="nav-item-icon">${t.icon}</span>${t.name}
            </button>
        `).join('')}
    `).join('') || '<div style="padding:20px;text-align:center;color:var(--text-3)">没有匹配的工具</div>';
}

// ===== 首页 =====
function renderHome() {
    $('#homeView').style.display = '';
    $('#toolView').style.display = 'none';
    $$('.nav-item').forEach(n => n.classList.remove('active'));

    // 按分组渲染
    const groups = {};
    TOOLS.forEach(t => {
        if (!groups[t.group]) groups[t.group] = [];
        groups[t.group].push(t);
    });

    let html = '';
    for (const [group, tools] of Object.entries(groups)) {
        html += `<div class="home-group">
            <div class="home-group-title">${group}</div>
            <div class="home-grid">
                ${tools.map((t, i) => `
                    <div class="home-card" data-id="${t.id}" style="animation-delay:${i * 0.05}s">
                        <div class="home-card-accent" style="background:linear-gradient(135deg, ${t.color}, ${t.color}88)"></div>
                        <div class="home-card-inner">
                            <div class="home-card-icon-wrap" style="background:${t.color}15;border:1.5px solid ${t.color}20">
                                <span class="home-card-icon">${t.icon}</span>
                            </div>
                            <div class="home-card-name">${t.name}</div>
                            <div class="home-card-desc">${t.desc}</div>
                            <div class="home-card-tag" style="color:${t.color};background:${t.color}10">${t.group}</div>
                        </div>
                    </div>
                `).join('')}
            </div>
        </div>`;
    }
    $('#homeGrid').innerHTML = html;
}

// ===== 打开工具 =====
function openTool(id) {
    const tool = TOOLS.find(t => t.id === id);
    if (!tool) return;
    $('#homeView').style.display = 'none';
    $('#toolView').style.display = '';
    $('#toolTitle').textContent = `${tool.icon} ${tool.name}`;
    $$('.nav-item').forEach(n => n.classList.toggle('active', n.dataset.id === id));
    const body = $('#toolBody');
    body.innerHTML = '';

    // 功能介绍卡片
    const intro = document.createElement('div');
    intro.innerHTML = `
        <div class="tool-intro" style="--tool-color:${tool.color}">
            <div class="tool-intro-header">
                <div class="tool-intro-icon" style="background:${tool.color}12;border-color:${tool.color}25">${tool.icon}</div>
                <div class="tool-intro-text">
                    <div class="tool-intro-title">${tool.detail}</div>
                </div>
            </div>
            <div class="tool-intro-examples">
                <div class="tool-intro-examples-title">💡 使用场景</div>
                ${tool.examples.map(ex => `<div class="tool-intro-example"><span class="tool-intro-dot" style="background:${tool.color}"></span>${ex}</div>`).join('')}
            </div>
        </div>
    `;
    body.appendChild(intro);

    // 工具操作区（渲染器会往 toolArea 里写 innerHTML）
    const toolArea = document.createElement('div');
    toolArea.className = 'tool-area';
    body.appendChild(toolArea);
    TOOL_RENDERERS[id]?.(toolArea);

    // 移动端关闭侧边栏
    $('#sidebar').classList.remove('open');
}

// ===== 全局事件 =====
function bindGlobal() {
    // 侧边栏点击
    $('#sidebarNav').addEventListener('click', e => {
        const item = e.target.closest('.nav-item');
        if (item) openTool(item.dataset.id);
    });
    // 首页卡片点击
    $('#homeGrid').addEventListener('click', e => {
        const card = e.target.closest('.home-card');
        if (card) openTool(card.dataset.id);
    });
    // 返回
    $('#btnBack').addEventListener('click', renderHome);
    // 搜索
    $('#toolSearch').addEventListener('input', e => {
        renderSidebar(e.target.value.trim().toLowerCase());
    });
    // 快捷键
    document.addEventListener('keydown', e => {
        if (e.key === '/' && !['INPUT','TEXTAREA'].includes(document.activeElement.tagName)) {
            e.preventDefault();
            $('#toolSearch').focus();
        }
    });
    // 主题
    $('#themeBtn').addEventListener('click', toggleTheme);
    // 移动端菜单
    $('#menuToggle').addEventListener('click', () => $('#sidebar').classList.toggle('open'));
    document.addEventListener('click', e => {
        if (window.innerWidth <= 768 && !e.target.closest('.sidebar') && !e.target.closest('.menu-toggle')) {
            $('#sidebar').classList.remove('open');
        }
    });
}

// ===== 主题 =====
function toggleTheme() {
    const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
    document.documentElement.setAttribute('data-theme', isDark ? 'light' : 'dark');
    $('#themeBtn').textContent = isDark ? '🌙' : '☀️';
    localStorage.setItem('devtools-theme', isDark ? 'light' : 'dark');
}

function loadTheme() {
    const s = localStorage.getItem('devtools-theme');
    if (s === 'dark' || (!s && window.matchMedia('(prefers-color-scheme:dark)').matches)) {
        document.documentElement.setAttribute('data-theme', 'dark');
        $('#themeBtn').textContent = '☀️';
    }
}

// ===== 工具函数 =====
function toast(msg) {
    const t = $('#toast');
    t.textContent = msg;
    t.classList.add('show');
    setTimeout(() => t.classList.remove('show'), 1800);
}

function copyText(text) {
    navigator.clipboard.writeText(text).then(() => toast('已复制'));
}

function makePanel(label, html) {
    return `<div class="panel"><div class="panel-label">${label}</div>${html}</div>`;
}

function makeResult(id) {
    return `<div class="result-box" id="${id}" style="position:relative"><span style="color:var(--text-3)">结果将显示在这里</span></div>`;
}

function addCopyBtn(boxId) {
    const box = $(`#${boxId}`);
    if (!box) return;
    const btn = document.createElement('button');
    btn.className = 'copy-btn';
    btn.textContent = '复制';
    btn.onclick = () => copyText(box.textContent);
    box.style.position = 'relative';
    box.appendChild(btn);
}

// ===== 工具渲染器 =====
const TOOL_RENDERERS = {

// ---------- JSON 格式化 ----------
json(el) {
    el.innerHTML = `
        ${makePanel('输入 JSON', '<textarea id="jsonIn" placeholder="粘贴 JSON 数据..."></textarea>')}
        <div class="btn-group">
            <button class="btn btn-primary" id="jsonFormat">✨ 格式化</button>
            <button class="btn btn-outline" id="jsonMinify">📦 压缩</button>
            <button class="btn btn-outline" id="jsonCopy">📋 复制结果</button>
        </div>
        ${makePanel('结果', makeResult('jsonOut'))}
    `;
    $('#jsonFormat').onclick = () => {
        try {
            const obj = JSON.parse($('#jsonIn').value);
            $('#jsonOut').textContent = JSON.stringify(obj, null, 2);
            addCopyBtn('jsonOut');
        } catch(e) { $('#jsonOut').innerHTML = `<span style="color:var(--red)">❌ ${e.message}</span>`; }
    };
    $('#jsonMinify').onclick = () => {
        try {
            const obj = JSON.parse($('#jsonIn').value);
            $('#jsonOut').textContent = JSON.stringify(obj);
            addCopyBtn('jsonOut');
        } catch(e) { $('#jsonOut').innerHTML = `<span style="color:var(--red)">❌ ${e.message}</span>`; }
    };
    $('#jsonCopy').onclick = () => copyText($('#jsonOut').textContent);
},

// ---------- Base64 ----------
base64(el) {
    el.innerHTML = `
        ${makePanel('输入', '<textarea id="b64In" placeholder="输入文本..."></textarea>')}
        <div class="btn-group">
            <button class="btn btn-primary" id="b64Enc">🔒 编码</button>
            <button class="btn btn-green" id="b64Dec">🔓 解码</button>
        </div>
        ${makePanel('结果', makeResult('b64Out'))}
    `;
    $('#b64Enc').onclick = () => {
        try { $('#b64Out').textContent = btoa(unescape(encodeURIComponent($('#b64In').value))); addCopyBtn('b64Out'); }
        catch(e) { $('#b64Out').innerHTML = `<span style="color:var(--red)">❌ 编码失败</span>`; }
    };
    $('#b64Dec').onclick = () => {
        try { $('#b64Out').textContent = decodeURIComponent(escape(atob($('#b64In').value.trim()))); addCopyBtn('b64Out'); }
        catch(e) { $('#b64Out').innerHTML = `<span style="color:var(--red)">❌ 解码失败，请检查输入</span>`; }
    };
},

// ---------- URL 编解码 ----------
url(el) {
    el.innerHTML = `
        ${makePanel('输入', '<textarea id="urlIn" placeholder="输入 URL 或文本..."></textarea>')}
        <div class="btn-group">
            <button class="btn btn-primary" id="urlEnc">🔒 编码</button>
            <button class="btn btn-green" id="urlDec">🔓 解码</button>
        </div>
        ${makePanel('结果', makeResult('urlOut'))}
    `;
    $('#urlEnc').onclick = () => { $('#urlOut').textContent = encodeURIComponent($('#urlIn').value); addCopyBtn('urlOut'); };
    $('#urlDec').onclick = () => {
        try { $('#urlOut').textContent = decodeURIComponent($('#urlIn').value); addCopyBtn('urlOut'); }
        catch(e) { $('#urlOut').innerHTML = `<span style="color:var(--red)">❌ 解码失败</span>`; }
    };
},

// ---------- Unicode ----------
unicode(el) {
    el.innerHTML = `
        ${makePanel('输入', '<textarea id="uniIn" placeholder="输入中文或 Unicode (如 \\u4f60\\u597d)"></textarea>')}
        <div class="btn-group">
            <button class="btn btn-primary" id="uniToCode">中文 → Unicode</button>
            <button class="btn btn-green" id="uniToText">Unicode → 中文</button>
        </div>
        ${makePanel('结果', makeResult('uniOut'))}
    `;
    $('#uniToCode').onclick = () => {
        const r = Array.from($('#uniIn').value).map(c => '\\u' + c.charCodeAt(0).toString(16).padStart(4,'0')).join('');
        $('#uniOut').textContent = r; addCopyBtn('uniOut');
    };
    $('#uniToText').onclick = () => {
        try {
            const r = $('#uniIn').value.replace(/\\u([0-9a-fA-F]{4})/g, (_, p) => String.fromCharCode(parseInt(p,16)));
            $('#uniOut').textContent = r; addCopyBtn('uniOut');
        } catch(e) { $('#uniOut').innerHTML = `<span style="color:var(--red)">❌ 转换失败</span>`; }
    };
},

// ---------- Hash 计算 ----------
hash(el) {
    el.innerHTML = `
        ${makePanel('输入', '<textarea id="hashIn" placeholder="输入要计算哈希的文本..."></textarea>')}
        <div class="btn-group"><button class="btn btn-primary" id="hashCalc">🔒 计算 Hash</button></div>
        ${makePanel('结果', '<div id="hashOut" style="display:flex;flex-direction:column;gap:8px"></div>')}
    `;
    $('#hashCalc').onclick = async () => {
        const text = $('#hashIn').value;
        const enc = new TextEncoder().encode(text);
        const algos = ['SHA-1', 'SHA-256', 'SHA-384', 'SHA-512'];
        const results = [];
        for (const algo of algos) {
            const buf = await crypto.subtle.digest(algo, enc);
            const hex = Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2,'0')).join('');
            results.push(`<div class="result-box" style="position:relative"><strong>${algo}:</strong><br>${hex}<button class="copy-btn" onclick="copyText('${hex}')">复制</button></div>`);
        }
        $('#hashOut').innerHTML = results.join('');
    };
},

// ---------- JWT 解析 ----------
jwt(el) {
    el.innerHTML = `
        ${makePanel('输入 JWT Token', '<textarea id="jwtIn" placeholder="粘贴 JWT Token..."></textarea>')}
        <div class="btn-group"><button class="btn btn-primary" id="jwtParse">🎫 解析</button></div>
        ${makePanel('Header', makeResult('jwtHeader'))}
        ${makePanel('Payload', makeResult('jwtPayload'))}
    `;
    $('#jwtParse').onclick = () => {
        try {
            const parts = $('#jwtIn').value.trim().split('.');
            if (parts.length < 2) throw new Error('无效的 JWT 格式');
            const decode = s => JSON.parse(decodeURIComponent(escape(atob(s.replace(/-/g,'+').replace(/_/g,'/')))));
            $('#jwtHeader').textContent = JSON.stringify(decode(parts[0]), null, 2);
            const payload = decode(parts[1]);
            if (payload.exp) payload._exp_readable = new Date(payload.exp * 1000).toLocaleString();
            if (payload.iat) payload._iat_readable = new Date(payload.iat * 1000).toLocaleString();
            $('#jwtPayload').textContent = JSON.stringify(payload, null, 2);
            addCopyBtn('jwtHeader'); addCopyBtn('jwtPayload');
        } catch(e) { $('#jwtHeader').innerHTML = `<span style="color:var(--red)">❌ ${e.message}</span>`; }
    };
},

// ---------- 正则测试 ----------
regex(el) {
    el.innerHTML = `
        ${makePanel('正则表达式', `
            <div class="panel-row">
                <div class="panel-col"><input type="text" id="regexPattern" placeholder="输入正则表达式 (不含 //)"></div>
                <div style="width:100px"><input type="text" id="regexFlags" placeholder="标志" value="g"></div>
            </div>
        `)}
        ${makePanel('测试文本', '<textarea id="regexText" placeholder="输入要测试的文本..."></textarea>')}
        <div class="btn-group"><button class="btn btn-primary" id="regexTest">🎯 测试</button></div>
        ${makePanel('匹配结果', makeResult('regexOut'))}
    `;
    $('#regexTest').onclick = () => {
        try {
            const re = new RegExp($('#regexPattern').value, $('#regexFlags').value);
            const text = $('#regexText').value;
            const matches = [...text.matchAll(re)];
            if (matches.length === 0) {
                $('#regexOut').innerHTML = '<span style="color:var(--text-3)">没有匹配</span>';
                return;
            }
            let highlighted = '';
            let last = 0;
            matches.forEach(m => {
                highlighted += escHtml(text.slice(last, m.index));
                highlighted += `<span class="regex-match">${escHtml(m[0])}</span>`;
                last = m.index + m[0].length;
            });
            highlighted += escHtml(text.slice(last));
            $('#regexOut').innerHTML = `<div>匹配 <strong>${matches.length}</strong> 处</div><hr style="border:none;border-top:1px solid var(--border);margin:8px 0"><div style="white-space:pre-wrap">${highlighted}</div>`;
        } catch(e) { $('#regexOut').innerHTML = `<span style="color:var(--red)">❌ ${e.message}</span>`; }
    };
},

// ---------- 文本对比 ----------
diff(el) {
    el.innerHTML = `
        <div class="panel-row">
            ${makePanel('文本 A', '<textarea id="diffA" placeholder="原始文本..."></textarea>')}
            ${makePanel('文本 B', '<textarea id="diffB" placeholder="修改后文本..."></textarea>')}
        </div>
        <div class="btn-group"><button class="btn btn-primary" id="diffRun">📊 对比</button></div>
        ${makePanel('差异结果', makeResult('diffOut'))}
    `;
    $('#diffRun').onclick = () => {
        const a = $('#diffA').value.split('\n'), b = $('#diffB').value.split('\n');
        const maxLen = Math.max(a.length, b.length);
        let html = '';
        for (let i = 0; i < maxLen; i++) {
            const la = a[i] ?? '', lb = b[i] ?? '';
            if (la === lb) {
                html += `<div>  ${escHtml(la)}</div>`;
            } else {
                if (la) html += `<div class="diff-del">- ${escHtml(la)}</div>`;
                if (lb) html += `<div class="diff-add">+ ${escHtml(lb)}</div>`;
            }
        }
        $('#diffOut').innerHTML = html || '<span style="color:var(--green)">两段文本完全相同</span>';
    };
},

// ---------- Markdown 预览 ----------
markdown(el) {
    el.innerHTML = `
        <div class="panel-row">
            <div class="panel-col">${makePanel('Markdown 输入', '<textarea id="mdIn" style="min-height:300px" placeholder="输入 Markdown..."></textarea>')}</div>
            <div class="panel-col">${makePanel('预览', '<div id="mdOut" class="result-box" style="min-height:300px;max-height:500px"></div>')}</div>
        </div>
    `;
    const render = () => { $('#mdOut').innerHTML = simpleMd($('#mdIn').value); };
    $('#mdIn').addEventListener('input', render);
    $('#mdIn').value = '# 标题\n\n## 二级标题\n\n这是一段**粗体**和*斜体*文本。\n\n- 列表项 1\n- 列表项 2\n- 列表项 3\n\n> 引用文本\n\n`行内代码`\n\n```\n代码块\nconsole.log("hello")\n```\n\n[链接](https://example.com)';
    render();
},

// ---------- 字数统计 ----------
textcount(el) {
    el.innerHTML = `
        ${makePanel('输入文本', '<textarea id="tcIn" placeholder="粘贴或输入文本..."></textarea>')}
        ${makePanel('统计结果', '<div id="tcOut" style="display:grid;grid-template-columns:repeat(auto-fill,minmax(140px,1fr));gap:10px"></div>')}
    `;
    const count = () => {
        const t = $('#tcIn').value;
        const chars = t.length;
        const charsNoSpace = t.replace(/\s/g, '').length;
        const words = t.trim() ? t.trim().split(/\s+/).length : 0;
        const lines = t ? t.split('\n').length : 0;
        const chinese = (t.match(/[\u4e00-\u9fff]/g) || []).length;
        const english = (t.match(/[a-zA-Z]+/g) || []).length;
        const numbers = (t.match(/\d+/g) || []).length;
        const bytes = new Blob([t]).size;
        const items = [
            ['字符数', chars], ['不含空格', charsNoSpace], ['单词数', words], ['行数', lines],
            ['中文字数', chinese], ['英文单词', english], ['数字', numbers], ['字节数', bytes],
        ];
        $('#tcOut').innerHTML = items.map(([l,v]) => `
            <div style="padding:12px;background:var(--bg-input);border-radius:var(--radius-sm);text-align:center">
                <div style="font-size:22px;font-weight:800;color:var(--primary)">${v}</div>
                <div style="font-size:12px;color:var(--text-3);margin-top:2px">${l}</div>
            </div>
        `).join('');
    };
    $('#tcIn').addEventListener('input', count);
    count();
},

// ---------- 大小写转换 ----------
case: function(el) {
    el.innerHTML = `
        ${makePanel('输入', '<textarea id="caseIn" placeholder="输入文本..."></textarea>')}
        <div class="btn-group">
            <button class="btn btn-primary" data-case="upper">UPPER</button>
            <button class="btn btn-outline" data-case="lower">lower</button>
            <button class="btn btn-outline" data-case="title">Title Case</button>
            <button class="btn btn-outline" data-case="camel">camelCase</button>
            <button class="btn btn-outline" data-case="snake">snake_case</button>
            <button class="btn btn-outline" data-case="kebab">kebab-case</button>
            <button class="btn btn-outline" data-case="pascal">PascalCase</button>
        </div>
        ${makePanel('结果', makeResult('caseOut'))}
    `;
    el.querySelectorAll('[data-case]').forEach(btn => {
        btn.onclick = () => {
            const t = $('#caseIn').value;
            const words = t.replace(/([a-z])([A-Z])/g,'$1 $2').replace(/[-_]+/g,' ').trim().split(/\s+/);
            let r = '';
            switch(btn.dataset.case) {
                case 'upper': r = t.toUpperCase(); break;
                case 'lower': r = t.toLowerCase(); break;
                case 'title': r = words.map(w => w[0].toUpperCase() + w.slice(1).toLowerCase()).join(' '); break;
                case 'camel': r = words.map((w,i) => i===0 ? w.toLowerCase() : w[0].toUpperCase()+w.slice(1).toLowerCase()).join(''); break;
                case 'snake': r = words.map(w => w.toLowerCase()).join('_'); break;
                case 'kebab': r = words.map(w => w.toLowerCase()).join('-'); break;
                case 'pascal': r = words.map(w => w[0].toUpperCase()+w.slice(1).toLowerCase()).join(''); break;
            }
            $('#caseOut').textContent = r; addCopyBtn('caseOut');
        };
    });
},

// ---------- 时间戳转换 ----------
timestamp(el) {
    el.innerHTML = `
        ${makePanel('当前时间', `<div id="tsNow" style="font-size:18px;font-weight:700;font-family:var(--mono)"></div>`)}
        <div class="panel-row">
            <div class="panel-col">
                ${makePanel('时间戳 → 日期', `
                    <input type="text" id="tsIn" placeholder="输入时间戳 (秒或毫秒)">
                    <div class="btn-group"><button class="btn btn-primary" id="tsToDate">转换</button></div>
                    <div id="tsDateOut" class="result-box" style="margin-top:10px;position:relative"></div>
                `)}
            </div>
            <div class="panel-col">
                ${makePanel('日期 → 时间戳', `
                    <input type="text" id="tsDateIn" placeholder="如 2025-01-01 12:00:00">
                    <div class="btn-group"><button class="btn btn-green" id="tsToStamp">转换</button></div>
                    <div id="tsStampOut" class="result-box" style="margin-top:10px;position:relative"></div>
                `)}
            </div>
        </div>
    `;
    const updateNow = () => {
        const now = new Date();
        $('#tsNow').textContent = `${Math.floor(now.getTime()/1000)}  |  ${now.toLocaleString()}`;
    };
    updateNow();
    const timer = setInterval(updateNow, 1000);
    const observer = new MutationObserver(() => { if (!document.contains($('#tsNow'))) { clearInterval(timer); observer.disconnect(); } });
    observer.observe(document.body, { childList: true, subtree: true });

    $('#tsToDate').onclick = () => {
        let ts = parseInt($('#tsIn').value);
        if (String(ts).length <= 10) ts *= 1000;
        const d = new Date(ts);
        if (isNaN(d.getTime())) { $('#tsDateOut').innerHTML = '<span style="color:var(--red)">无效时间戳</span>'; return; }
        $('#tsDateOut').textContent = `本地: ${d.toLocaleString()}\nUTC: ${d.toUTCString()}\nISO: ${d.toISOString()}`;
        addCopyBtn('tsDateOut');
    };
    $('#tsToStamp').onclick = () => {
        const d = new Date($('#tsDateIn').value);
        if (isNaN(d.getTime())) { $('#tsStampOut').innerHTML = '<span style="color:var(--red)">无效日期</span>'; return; }
        $('#tsStampOut').textContent = `秒: ${Math.floor(d.getTime()/1000)}\n毫秒: ${d.getTime()}`;
        addCopyBtn('tsStampOut');
    };
},

// ---------- 颜色转换 ----------
color(el) {
    el.innerHTML = `
        ${makePanel('选择颜色', `
            <div class="panel-row" style="align-items:center">
                <input type="color" id="colorPicker" value="#6366f1" style="width:60px;height:44px;border:none;cursor:pointer;border-radius:8px">
                <div class="panel-col"><input type="text" id="colorHex" placeholder="#6366f1" value="#6366f1"></div>
            </div>
        `)}
        <div class="color-preview" id="colorPreview" style="background:#6366f1"></div>
        ${makePanel('转换结果', '<div id="colorOut" style="display:flex;flex-direction:column;gap:8px"></div>')}
    `;
    const update = (hex) => {
        hex = hex.startsWith('#') ? hex : '#' + hex;
        if (!/^#[0-9a-fA-F]{6}$/.test(hex)) return;
        $('#colorPicker').value = hex;
        $('#colorHex').value = hex;
        $('#colorPreview').style.background = hex;
        const r = parseInt(hex.slice(1,3),16), g = parseInt(hex.slice(3,5),16), b = parseInt(hex.slice(5,7),16);
        const rf=r/255, gf=g/255, bf=b/255;
        const max=Math.max(rf,gf,bf), min=Math.min(rf,gf,bf), d=max-min;
        let h=0, s=0, l=(max+min)/2;
        if(d!==0){ s=l>0.5?d/(2-max-min):d/(max+min); switch(max){case rf:h=((gf-bf)/d+(gf<bf?6:0))/6;break;case gf:h=((bf-rf)/d+2)/6;break;case bf:h=((rf-gf)/d+4)/6;break;}}
        h=Math.round(h*360); s=Math.round(s*100); l=Math.round(l*100);
        const items = [
            ['HEX', hex.toUpperCase()],
            ['RGB', `rgb(${r}, ${g}, ${b})`],
            ['RGBA', `rgba(${r}, ${g}, ${b}, 1)`],
            ['HSL', `hsl(${h}, ${s}%, ${l}%)`],
            ['CSS 变量', `--color: ${hex};`],
            ['OC UIColor', `[UIColor colorWithRed:${(r/255).toFixed(3)} green:${(g/255).toFixed(3)} blue:${(b/255).toFixed(3)} alpha:1.0]`],
            ['Swift', `Color(red: ${(r/255).toFixed(3)}, green: ${(g/255).toFixed(3)}, blue: ${(b/255).toFixed(3)})`],
        ];
        $('#colorOut').innerHTML = items.map(([l,v]) => `
            <div class="result-box" style="position:relative;padding:10px 14px;cursor:pointer" onclick="copyText('${v.replace(/'/g,"\\'")}')">
                <strong style="color:var(--text-3);font-size:11px">${l}</strong><br>
                <span style="font-family:var(--mono);font-size:13px">${v}</span>
                <button class="copy-btn">复制</button>
            </div>
        `).join('');
    };
    $('#colorPicker').oninput = e => update(e.target.value);
    $('#colorHex').oninput = e => update(e.target.value);
    update('#6366f1');
},

// ---------- 二维码生成 ----------
qrcode(el) {
    el.innerHTML = `
        ${makePanel('输入内容', '<textarea id="qrIn" placeholder="输入文本或链接..." style="min-height:80px"></textarea>')}
        <div class="btn-group"><button class="btn btn-primary" id="qrGen">📱 生成二维码</button></div>
        ${makePanel('二维码', '<div class="qr-output" id="qrOut"><span style="color:var(--text-3)">点击生成按钮</span></div>')}
    `;
    $('#qrGen').onclick = () => {
        const text = $('#qrIn').value.trim();
        if (!text) { toast('请输入内容'); return; }
        const size = 200;
        const canvas = document.createElement('canvas');
        canvas.width = size; canvas.height = size;
        const ctx = canvas.getContext('2d');
        // 简易二维码：使用 API 生成图片
        const img = new Image();
        img.crossOrigin = 'anonymous';
        img.onload = () => {
            ctx.drawImage(img, 0, 0, size, size);
            $('#qrOut').innerHTML = '';
            $('#qrOut').appendChild(canvas);
            const dlBtn = document.createElement('button');
            dlBtn.className = 'btn btn-outline';
            dlBtn.style.marginTop = '12px';
            dlBtn.textContent = '💾 下载';
            dlBtn.onclick = () => {
                const a = document.createElement('a');
                a.download = 'qrcode.png';
                a.href = canvas.toDataURL();
                a.click();
            };
            $('#qrOut').appendChild(dlBtn);
        };
        img.onerror = () => { $('#qrOut').innerHTML = '<span style="color:var(--red)">生成失败，请检查网络</span>'; };
        img.src = `https://api.qrserver.com/v1/create-qr-code/?size=${size}x${size}&data=${encodeURIComponent(text)}`;
    };
},

// ---------- 占位图生成 ----------
placeholder(el) {
    el.innerHTML = `
        ${makePanel('设置', `
            <div class="panel-row">
                <div class="panel-col"><div class="panel-label">宽度</div><input type="number" id="phW" value="400" min="1" max="2000"></div>
                <div class="panel-col"><div class="panel-label">高度</div><input type="number" id="phH" value="300" min="1" max="2000"></div>
                <div class="panel-col"><div class="panel-label">背景色</div><input type="color" id="phBg" value="#6366f1"></div>
                <div class="panel-col"><div class="panel-label">文字色</div><input type="color" id="phFg" value="#ffffff"></div>
            </div>
            <div style="margin-top:10px"><div class="panel-label">文字（留空显示尺寸）</div><input type="text" id="phText" placeholder="自定义文字"></div>
        `)}
        <div class="btn-group"><button class="btn btn-primary" id="phGen">🖼️ 生成</button></div>
        ${makePanel('预览', '<div id="phOut" style="text-align:center"><span style="color:var(--text-3)">点击生成</span></div>')}
    `;
    $('#phGen').onclick = () => {
        const w = +$('#phW').value || 400, h = +$('#phH').value || 300;
        const bg = $('#phBg').value, fg = $('#phFg').value;
        const text = $('#phText').value || `${w} × ${h}`;
        const canvas = document.createElement('canvas');
        canvas.width = w; canvas.height = h;
        const ctx = canvas.getContext('2d');
        ctx.fillStyle = bg;
        ctx.fillRect(0, 0, w, h);
        ctx.fillStyle = fg;
        ctx.font = `bold ${Math.min(w,h)/8}px sans-serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(text, w/2, h/2);
        const out = $('#phOut');
        out.innerHTML = '';
        canvas.style.maxWidth = '100%';
        canvas.style.borderRadius = '8px';
        out.appendChild(canvas);
        const dlBtn = document.createElement('button');
        dlBtn.className = 'btn btn-outline';
        dlBtn.style.marginTop = '12px';
        dlBtn.textContent = '💾 下载';
        dlBtn.onclick = () => { const a = document.createElement('a'); a.download = `placeholder-${w}x${h}.png`; a.href = canvas.toDataURL(); a.click(); };
        out.appendChild(dlBtn);
    };
},

// ---------- 进制转换 ----------
number(el) {
    el.innerHTML = `
        ${makePanel('输入', `
            <div class="panel-row">
                <div class="panel-col"><input type="text" id="numIn" placeholder="输入数字"></div>
                <div style="width:120px"><select id="numBase">
                    <option value="2">二进制</option>
                    <option value="8">八进制</option>
                    <option value="10" selected>十进制</option>
                    <option value="16">十六进制</option>
                </select></div>
            </div>
        `)}
        <div class="btn-group"><button class="btn btn-primary" id="numConvert">🔢 转换</button></div>
        ${makePanel('结果', '<div id="numOut" style="display:flex;flex-direction:column;gap:8px"></div>')}
    `;
    $('#numConvert').onclick = () => {
        const val = parseInt($('#numIn').value, +$('#numBase').value);
        if (isNaN(val)) { $('#numOut').innerHTML = '<span style="color:var(--red)">无效数字</span>'; return; }
        const bases = [[2,'二进制','BIN'],[8,'八进制','OCT'],[10,'十进制','DEC'],[16,'十六进制','HEX']];
        $('#numOut').innerHTML = bases.map(([b,name,label]) => `
            <div class="result-box" style="position:relative;padding:10px 14px;cursor:pointer" onclick="copyText('${val.toString(b).toUpperCase()}')">
                <strong style="color:var(--text-3);font-size:11px">${name} (${label})</strong><br>
                <span style="font-family:var(--mono);font-size:14px">${val.toString(b).toUpperCase()}</span>
                <button class="copy-btn">复制</button>
            </div>
        `).join('');
    };
},

// ---------- UUID 生成 ----------
uuid(el) {
    el.innerHTML = `
        ${makePanel('设置', `
            <div class="panel-row" style="align-items:center">
                <div class="panel-label" style="margin:0">数量</div>
                <input type="number" id="uuidCount" value="5" min="1" max="100" style="width:80px">
                <label style="font-size:13px;display:flex;align-items:center;gap:6px">
                    <input type="checkbox" id="uuidUpper"> 大写
                </label>
                <label style="font-size:13px;display:flex;align-items:center;gap:6px">
                    <input type="checkbox" id="uuidNoDash"> 无横线
                </label>
            </div>
        `)}
        <div class="btn-group">
            <button class="btn btn-primary" id="uuidGen">🆔 生成</button>
            <button class="btn btn-outline" id="uuidCopy">📋 全部复制</button>
        </div>
        ${makePanel('结果', makeResult('uuidOut'))}
    `;
    const gen = () => {
        const n = Math.min(+$('#uuidCount').value || 5, 100);
        const upper = $('#uuidUpper').checked;
        const noDash = $('#uuidNoDash').checked;
        const uuids = [];
        for (let i = 0; i < n; i++) {
            let u = crypto.randomUUID();
            if (noDash) u = u.replace(/-/g, '');
            if (upper) u = u.toUpperCase();
            uuids.push(u);
        }
        $('#uuidOut').textContent = uuids.join('\n');
        addCopyBtn('uuidOut');
    };
    $('#uuidGen').onclick = gen;
    $('#uuidCopy').onclick = () => copyText($('#uuidOut').textContent);
    gen();
},

// ---------- 密码生成 ----------
password(el) {
    el.innerHTML = `
        ${makePanel('设置', `
            <div class="panel-row">
                <div class="panel-col"><div class="panel-label">长度</div><input type="number" id="pwLen" value="16" min="4" max="128"></div>
                <div class="panel-col"><div class="panel-label">数量</div><input type="number" id="pwCount" value="5" min="1" max="20"></div>
            </div>
            <div style="display:flex;gap:16px;margin-top:10px;flex-wrap:wrap">
                <label style="font-size:13px;display:flex;align-items:center;gap:6px"><input type="checkbox" id="pwUpper" checked> 大写 A-Z</label>
                <label style="font-size:13px;display:flex;align-items:center;gap:6px"><input type="checkbox" id="pwLower" checked> 小写 a-z</label>
                <label style="font-size:13px;display:flex;align-items:center;gap:6px"><input type="checkbox" id="pwDigit" checked> 数字 0-9</label>
                <label style="font-size:13px;display:flex;align-items:center;gap:6px"><input type="checkbox" id="pwSymbol" checked> 符号 !@#$</label>
            </div>
        `)}
        <div class="btn-group">
            <button class="btn btn-primary" id="pwGen">🔑 生成</button>
            <button class="btn btn-outline" id="pwCopy">📋 全部复制</button>
        </div>
        ${makePanel('结果', makeResult('pwOut'))}
    `;
    const gen = () => {
        let chars = '';
        if ($('#pwUpper').checked) chars += 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
        if ($('#pwLower').checked) chars += 'abcdefghijklmnopqrstuvwxyz';
        if ($('#pwDigit').checked) chars += '0123456789';
        if ($('#pwSymbol').checked) chars += '!@#$%^&*()_+-=[]{}|;:,.<>?';
        if (!chars) { toast('请至少选择一种字符类型'); return; }
        const len = +$('#pwLen').value || 16;
        const count = +$('#pwCount').value || 5;
        const passwords = [];
        const arr = new Uint32Array(len);
        for (let i = 0; i < count; i++) {
            crypto.getRandomValues(arr);
            passwords.push(Array.from(arr, v => chars[v % chars.length]).join(''));
        }
        $('#pwOut').textContent = passwords.join('\n');
        addCopyBtn('pwOut');
    };
    $('#pwGen').onclick = gen;
    $('#pwCopy').onclick = () => copyText($('#pwOut').textContent);
    gen();
},

// ---------- Lorem 文本 ----------
lorem(el) {
    const loremWords = 'lorem ipsum dolor sit amet consectetur adipiscing elit sed do eiusmod tempor incididunt ut labore et dolore magna aliqua ut enim ad minim veniam quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur excepteur sint occaecat cupidatat non proident sunt in culpa qui officia deserunt mollit anim id est laborum'.split(' ');
    el.innerHTML = `
        ${makePanel('设置', `
            <div class="panel-row" style="align-items:center">
                <div class="panel-label" style="margin:0">段落数</div>
                <input type="number" id="loremCount" value="3" min="1" max="20" style="width:80px">
                <label style="font-size:13px;display:flex;align-items:center;gap:6px">
                    <input type="checkbox" id="loremCn"> 中文
                </label>
            </div>
        `)}
        <div class="btn-group">
            <button class="btn btn-primary" id="loremGen">📄 生成</button>
            <button class="btn btn-outline" id="loremCopy">📋 复制</button>
        </div>
        ${makePanel('结果', makeResult('loremOut'))}
    `;
    const cnChars = '的一是不了人我在有他这为之大来以个中上们到说国和地也子时道出会三要于下得可你年生自主学多没同行面前等新通已被从进把好开第如都然作使思与想利她两当知无正此些最力理心外更长定现让相回看期给性次素几入每万向头将组重机果却再治真务具万且根已山认几表条白话因被气它合建议程华证世民利月明取消';
    const genCn = () => {
        let s = '';
        const len = 40 + Math.floor(Math.random() * 60);
        for (let i = 0; i < len; i++) s += cnChars[Math.floor(Math.random() * cnChars.length)];
        return s + '。';
    };
    const gen = () => {
        const n = +$('#loremCount').value || 3;
        const cn = $('#loremCn').checked;
        const paragraphs = [];
        for (let i = 0; i < n; i++) {
            if (cn) {
                paragraphs.push(genCn() + genCn());
            } else {
                const words = [];
                const len = 40 + Math.floor(Math.random() * 40);
                for (let j = 0; j < len; j++) words.push(loremWords[Math.floor(Math.random() * loremWords.length)]);
                words[0] = words[0][0].toUpperCase() + words[0].slice(1);
                paragraphs.push(words.join(' ') + '.');
            }
        }
        $('#loremOut').textContent = paragraphs.join('\n\n');
        addCopyBtn('loremOut');
    };
    $('#loremGen').onclick = gen;
    $('#loremCopy').onclick = () => copyText($('#loremOut').textContent);
    gen();
},

// ---------- HTML/JS 转义 ----------
htmlescape(el) {
    el.innerHTML = `
        ${makePanel('输入', '<textarea id="heIn" placeholder="输入 HTML 或文本..."></textarea>')}
        <div class="btn-group">
            <button class="btn btn-primary" id="heEncode">🛡️ HTML 转义</button>
            <button class="btn btn-green" id="heDecode">🔓 HTML 反转义</button>
            <button class="btn btn-outline" id="heJsEncode">JS 字符串转义</button>
        </div>
        ${makePanel('结果', makeResult('heOut'))}
    `;
    $('#heEncode').onclick = () => {
        $('#heOut').textContent = $('#heIn').value.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#39;');
        addCopyBtn('heOut');
    };
    $('#heDecode').onclick = () => {
        const ta = document.createElement('textarea');
        ta.innerHTML = $('#heIn').value;
        $('#heOut').textContent = ta.value;
        addCopyBtn('heOut');
    };
    $('#heJsEncode').onclick = () => {
        $('#heOut').textContent = JSON.stringify($('#heIn').value);
        addCopyBtn('heOut');
    };
},

// ---------- CSS 单位换算 ----------
cssunit(el) {
    el.innerHTML = `
        ${makePanel('设置基准值', `
            <div class="panel-row">
                <div class="panel-col"><div class="panel-label">根字号 (px)</div><input type="number" id="cssRoot" value="16"></div>
                <div class="panel-col"><div class="panel-label">视口宽度 (px)</div><input type="number" id="cssVw" value="375"></div>
                <div class="panel-col"><div class="panel-label">视口高度 (px)</div><input type="number" id="cssVh" value="812"></div>
            </div>
        `)}
        ${makePanel('输入值', `
            <div class="panel-row">
                <div class="panel-col"><input type="number" id="cssVal" value="16" step="any"></div>
                <div style="width:120px"><select id="cssFrom">
                    <option value="px">px</option><option value="rem">rem</option><option value="em">em</option>
                    <option value="vw">vw</option><option value="vh">vh</option><option value="pt">pt</option>
                </select></div>
            </div>
        `)}
        <div class="btn-group"><button class="btn btn-primary" id="cssConvert">📐 换算</button></div>
        ${makePanel('结果', '<div id="cssOut" style="display:flex;flex-direction:column;gap:8px"></div>')}
    `;
    $('#cssConvert').onclick = () => {
        const val = parseFloat($('#cssVal').value), from = $('#cssFrom').value;
        const root = parseFloat($('#cssRoot').value) || 16;
        const vw = parseFloat($('#cssVw').value) || 375;
        const vh = parseFloat($('#cssVh').value) || 812;
        let px;
        switch(from) {
            case 'px': px = val; break;
            case 'rem': case 'em': px = val * root; break;
            case 'vw': px = val * vw / 100; break;
            case 'vh': px = val * vh / 100; break;
            case 'pt': px = val * 4 / 3; break;
        }
        const results = [
            ['px', px.toFixed(2) + ' px'],
            ['rem', (px / root).toFixed(4) + ' rem'],
            ['em', (px / root).toFixed(4) + ' em'],
            ['vw', (px / vw * 100).toFixed(4) + ' vw'],
            ['vh', (px / vh * 100).toFixed(4) + ' vh'],
            ['pt', (px * 3 / 4).toFixed(2) + ' pt'],
        ];
        $('#cssOut').innerHTML = results.map(([l,v]) => `
            <div class="result-box" style="position:relative;padding:10px 14px;cursor:pointer" onclick="copyText('${v}')">
                <strong style="color:var(--text-3);font-size:11px">${l}</strong><br>
                <span style="font-family:var(--mono);font-size:14px">${v}</span>
                <button class="copy-btn">复制</button>
            </div>
        `).join('');
    };
},

// ---------- Cron 表达式 ----------
cron(el) {
    el.innerHTML = `
        ${makePanel('输入 Cron 表达式', `
            <input type="text" id="cronIn" placeholder="如 0 9 * * 1-5 (分 时 日 月 周)" value="*/5 * * * *">
        `)}
        <div class="btn-group"><button class="btn btn-primary" id="cronParse">⏱️ 解析</button></div>
        ${makePanel('解析结果', makeResult('cronOut'))}
    `;
    $('#cronParse').onclick = () => {
        const parts = $('#cronIn').value.trim().split(/\s+/);
        if (parts.length < 5 || parts.length > 6) {
            $('#cronOut').innerHTML = '<span style="color:var(--red)">❌ 格式错误，需要 5 或 6 个字段（分 时 日 月 周）</span>';
            return;
        }
        const labels = parts.length === 6 ? ['秒','分','时','日','月','周'] : ['分','时','日','月','周'];
        const descMap = { '*': '每', '*/': '每隔 ', '0': '' };
        let desc = '';
        const offset = parts.length === 6 ? 1 : 0;
        const min = parts[0 + offset], hour = parts[1 + offset], day = parts[2 + offset], month = parts[3 + offset], week = parts[4 + offset];
        const weekNames = ['日','一','二','三','四','五','六'];
        // 简易描述
        let lines = [];
        if (week !== '*') lines.push('每周' + week.split(',').map(w => weekNames[parseInt(w)] || w).join('、'));
        if (month !== '*') lines.push(month + ' 月');
        if (day !== '*') lines.push('每月第 ' + day + ' 天');
        if (hour === '*') lines.push('每小时');
        else if (hour.startsWith('*/')) lines.push('每隔 ' + hour.slice(2) + ' 小时');
        else lines.push(hour + ' 点');
        if (min === '*') lines.push('每分钟');
        else if (min.startsWith('*/')) lines.push('每隔 ' + min.slice(2) + ' 分钟');
        else lines.push(min + ' 分');
        desc = lines.join('，');
        // 计算下次执行时间
        let nextTimes = [];
        try {
            const now = new Date();
            for (let i = 0; i < 5; i++) {
                now.setMinutes(now.getMinutes() + 1);
                nextTimes.push(now.toLocaleString());
            }
        } catch(e) {}
        let html = `<strong>📖 描述：</strong>${desc}\n\n`;
        html += `<strong>📋 字段解析：</strong>\n`;
        parts.forEach((p, i) => { html += `  ${labels[i]}: ${p}\n`; });
        html += `\n<strong>⏰ 接下来可能的执行时间（仅参考）：</strong>\n`;
        nextTimes.forEach(t => { html += `  ${t}\n`; });
        $('#cronOut').innerHTML = html;
        addCopyBtn('cronOut');
    };
},

}; // end TOOL_RENDERERS


// ===== 辅助函数 =====
function escHtml(s) {
    return s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

// 简易 Markdown 渲染
function simpleMd(text) {
    let html = escHtml(text);
    // 代码块
    html = html.replace(/```([\s\S]*?)```/g, '<pre style="background:var(--bg-input);padding:12px;border-radius:8px;overflow-x:auto;font-family:var(--mono);font-size:13px">$1</pre>');
    // 行内代码
    html = html.replace(/`([^`]+)`/g, '<code style="background:var(--bg-input);padding:2px 6px;border-radius:4px;font-family:var(--mono);font-size:13px">$1</code>');
    // 标题
    html = html.replace(/^### (.+)$/gm, '<h3 style="font-size:16px;margin:12px 0 6px">$1</h3>');
    html = html.replace(/^## (.+)$/gm, '<h2 style="font-size:20px;margin:16px 0 8px">$1</h2>');
    html = html.replace(/^# (.+)$/gm, '<h1 style="font-size:24px;margin:20px 0 10px">$1</h1>');
    // 粗体斜体
    html = html.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
    html = html.replace(/\*(.+?)\*/g, '<em>$1</em>');
    // 引用
    html = html.replace(/^&gt; (.+)$/gm, '<blockquote style="border-left:3px solid var(--primary);padding:4px 12px;margin:8px 0;color:var(--text-2)">$1</blockquote>');
    // 列表
    html = html.replace(/^- (.+)$/gm, '<li style="margin:4px 0;margin-left:20px">$1</li>');
    // 链接
    html = html.replace(/\[(.+?)\]\((.+?)\)/g, '<a href="$2" target="_blank" style="color:var(--primary)">$1</a>');
    // 分割线
    html = html.replace(/^---$/gm, '<hr style="border:none;border-top:1px solid var(--border);margin:16px 0">');
    // 换行
    html = html.replace(/\n/g, '<br>');
    return html;
}

// ---------- SQL 格式化 ----------
TOOL_RENDERERS.sql = function(el) {
    el.innerHTML = `
        ${makePanel('输入 SQL', '<textarea id="sqlIn" placeholder="粘贴 SQL 语句..."></textarea>')}
        <div class="btn-group">
            <button class="btn btn-primary" id="sqlFormat">✨ 格式化</button>
            <button class="btn btn-outline" id="sqlMinify">📦 压缩成一行</button>
        </div>
        ${makePanel('结果', makeResult('sqlOut'))}
    `;
    $('#sqlFormat').onclick = () => {
        let sql = $('#sqlIn').value.trim();
        const keywords = ['SELECT','FROM','WHERE','AND','OR','ORDER BY','GROUP BY','HAVING','LIMIT','OFFSET','JOIN','LEFT JOIN','RIGHT JOIN','INNER JOIN','OUTER JOIN','ON','SET','VALUES','INSERT INTO','UPDATE','DELETE FROM','CREATE TABLE','ALTER TABLE','DROP TABLE','AS','IN','NOT','BETWEEN','LIKE','IS NULL','IS NOT NULL','UNION','UNION ALL','CASE','WHEN','THEN','ELSE','END'];
        // 先统一空格
        sql = sql.replace(/\s+/g, ' ');
        // 关键字前换行
        keywords.sort((a,b) => b.length - a.length).forEach(kw => {
            const re = new RegExp('\\b(' + kw + ')\\b', 'gi');
            sql = sql.replace(re, '\n$1');
        });
        // 缩进子句
        const lines = sql.split('\n').map(l => l.trim()).filter(Boolean);
        const indentKw = ['AND','OR','ON','SET','VALUES','WHEN','THEN','ELSE'];
        const result = lines.map(l => {
            const upper = l.toUpperCase();
            if (indentKw.some(k => upper.startsWith(k))) return '    ' + l;
            return l;
        }).join('\n');
        $('#sqlOut').textContent = result;
        addCopyBtn('sqlOut');
    };
    $('#sqlMinify').onclick = () => {
        $('#sqlOut').textContent = $('#sqlIn').value.replace(/\s+/g, ' ').trim();
        addCopyBtn('sqlOut');
    };
};

// ---------- 正则常用库 ----------
TOOL_RENDERERS.regexlib = function(el) {
    const patterns = [
        // 表单校验
        { name: '手机号（中国大陆）', regex: '^1[3-9]\\d{9}$', example: '13812345678', cat: '📱 表单校验' },
        { name: '邮箱地址', regex: '^[\\w.-]+@[\\w.-]+\\.\\w{2,}$', example: 'test@example.com', cat: '📱 表单校验' },
        { name: '身份证号（18位）', regex: '^[1-9]\\d{5}(?:19|20)\\d{2}(?:0[1-9]|1[0-2])(?:0[1-9]|[12]\\d|3[01])\\d{3}[\\dXx]$', example: '110101199001011234', cat: '📱 表单校验' },
        { name: '用户名（字母数字下划线）', regex: '^[a-zA-Z]\\w{3,15}$', example: 'user_123', cat: '📱 表单校验' },
        { name: '强密码（8+位含大小写数字符号）', regex: '^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)(?=.*[!@#$%^&*]).{8,}$', example: 'Abc@1234', cat: '📱 表单校验' },
        { name: '金额（两位小数）', regex: '^\\d+(\\.\\d{1,2})?$', example: '99.99', cat: '📱 表单校验' },
        // 网络相关
        { name: 'URL 链接', regex: '^https?:\\/\\/[\\w.-]+(?:\\.[\\w.-]+)+[\\w.,@?^=%&:/~+#-]*$', example: 'https://example.com/path', cat: '🌐 网络相关' },
        { name: 'IPv4 地址', regex: '^(?:(?:25[0-5]|2[0-4]\\d|[01]?\\d\\d?)\\.){3}(?:25[0-5]|2[0-4]\\d|[01]?\\d\\d?)$', example: '192.168.1.1', cat: '🌐 网络相关' },
        { name: '域名', regex: '^[a-zA-Z0-9][-a-zA-Z0-9]{0,62}(\\.[a-zA-Z0-9][-a-zA-Z0-9]{0,62})+$', example: 'www.example.com', cat: '🌐 网络相关' },
        { name: 'MAC 地址', regex: '^([0-9a-fA-F]{2}[:-]){5}[0-9a-fA-F]{2}$', example: '00:1A:2B:3C:4D:5E', cat: '🌐 网络相关' },
        { name: '端口号（1-65535）', regex: '^([1-9]\\d{0,3}|[1-5]\\d{4}|6[0-4]\\d{3}|65[0-4]\\d{2}|655[0-2]\\d|6553[0-5])$', example: '8080', cat: '🌐 网络相关' },
        // 日期与数字
        { name: '日期 YYYY-MM-DD', regex: '^\\d{4}-(?:0[1-9]|1[0-2])-(?:0[1-9]|[12]\\d|3[01])$', example: '2025-01-15', cat: '📅 日期与数字' },
        { name: '时间 HH:MM:SS', regex: '^(?:[01]\\d|2[0-3]):[0-5]\\d:[0-5]\\d$', example: '23:59:59', cat: '📅 日期与数字' },
        { name: 'ISO 8601 日期时间', regex: '^\\d{4}-\\d{2}-\\d{2}T\\d{2}:\\d{2}:\\d{2}(?:\\.\\d+)?(?:Z|[+-]\\d{2}:\\d{2})$', example: '2025-01-15T08:30:00Z', cat: '📅 日期与数字' },
        { name: '整数', regex: '^-?\\d+$', example: '-42', cat: '📅 日期与数字' },
        { name: '浮点数', regex: '^-?\\d+\\.\\d+$', example: '3.14', cat: '📅 日期与数字' },
        // 编码与格式
        { name: '十六进制颜色', regex: '^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$', example: '#ff6600', cat: '🎨 编码与格式' },
        { name: 'UUID', regex: '^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$', example: '550e8400-e29b-41d4-a716-446655440000', cat: '🎨 编码与格式' },
        { name: 'Base64 字符串', regex: '^(?:[A-Za-z0-9+/]{4})*(?:[A-Za-z0-9+/]{2}==|[A-Za-z0-9+/]{3}=)?$', example: 'SGVsbG8gV29ybGQ=', cat: '🎨 编码与格式' },
        { name: 'MD5 哈希（32位）', regex: '^[a-fA-F0-9]{32}$', example: 'd41d8cd98f00b204e9800998ecf8427e', cat: '🎨 编码与格式' },
        // 开发常用
        { name: 'HTML 标签', regex: '<([a-zA-Z][a-zA-Z0-9]*)\\b[^>]*>(.*?)<\\/\\1>', example: '<div class="test">内容</div>', cat: '💻 开发常用' },
        { name: 'JS 变量名', regex: '^[a-zA-Z_$][a-zA-Z0-9_$]*$', example: 'myVariable', cat: '💻 开发常用' },
        { name: '版本号 (SemVer)', regex: '^\\d+\\.\\d+\\.\\d+(-[a-zA-Z0-9.]+)?(\\+[a-zA-Z0-9.]+)?$', example: '1.2.3-beta.1', cat: '💻 开发常用' },
        { name: 'Docker 镜像名', regex: '^[a-z0-9]+(?:[._-][a-z0-9]+)*(?:\\/[a-z0-9]+(?:[._-][a-z0-9]+)*)*(?::[a-zA-Z0-9._-]+)?$', example: 'nginx:1.25-alpine', cat: '💻 开发常用' },
        { name: 'Git Commit Hash', regex: '^[0-9a-f]{7,40}$', example: 'a1b2c3d', cat: '💻 开发常用' },
        { name: '文件扩展名（常见）', regex: '\\.(jpg|jpeg|png|gif|svg|webp|pdf|doc|docx|xls|xlsx|zip|rar|mp3|mp4)$', example: 'photo.jpg', cat: '💻 开发常用' },
        { name: 'Unix 文件路径', regex: '^\\/(?:[^\\/]+\\/)*[^\\/]+$', example: '/usr/local/bin/node', cat: '💻 开发常用' },
    ];
    el.innerHTML = `
        ${makePanel('常用正则表达式', `
            <div style="margin-bottom:10px"><input type="text" id="regexLibSearch" placeholder="搜索正则..."></div>
            <div id="regexLibList"></div>
        `)}
    `;
    const render = (filter = '') => {
        const f = filter.toLowerCase();
        const filtered = patterns.filter(p => !f || p.name.toLowerCase().includes(f) || p.regex.toLowerCase().includes(f) || p.example.toLowerCase().includes(f));
        const groups = {};
        filtered.forEach(p => { if (!groups[p.cat]) groups[p.cat] = []; groups[p.cat].push(p); });
        $('#regexLibList').innerHTML = Object.entries(groups).map(([cat, items]) => `
            <div style="margin-bottom:16px">
                <div style="font-size:13px;font-weight:700;color:var(--text-2);margin-bottom:8px;padding-left:2px">${cat}</div>
                ${items.map(p => `
                    <div class="result-box" style="position:relative;padding:12px 14px;cursor:pointer;margin-bottom:6px" onclick="copyText('${p.regex.replace(/\\/g,'\\\\').replace(/'/g,"\\'")}')">
                        <div style="font-size:13px;font-weight:600;margin-bottom:4px">${p.name}</div>
                        <div style="font-family:var(--mono);font-size:12px;color:var(--primary);word-break:break-all">${escHtml(p.regex)}</div>
                        <div style="font-size:11px;color:var(--text-3);margin-top:4px">示例: ${escHtml(p.example)}</div>
                        <button class="copy-btn">复制</button>
                    </div>
                `).join('')}
            </div>
        `).join('') || '<div style="padding:20px;text-align:center;color:var(--text-3)">没有匹配的正则</div>';
    };
    render();
    $('#regexLibSearch').addEventListener('input', e => render(e.target.value.trim()));
};

// ---------- 图片转 Base64 ----------
TOOL_RENDERERS.img2base64 = function(el) {
    el.innerHTML = `
        ${makePanel('选择图片', `
            <input type="file" id="imgFile" accept="image/*" style="font-family:var(--sans)">
            <div id="imgPreview" style="margin-top:12px;text-align:center"></div>
        `)}
        ${makePanel('Base64 结果', `
            <div id="imgInfo" style="font-size:12px;color:var(--text-3);margin-bottom:8px"></div>
            ${makeResult('imgOut')}
        `)}
    `;
    $('#imgFile').onchange = (e) => {
        const file = e.target.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (ev) => {
            const dataUri = ev.target.result;
            $('#imgPreview').innerHTML = `<img src="${dataUri}" style="max-width:200px;max-height:200px;border-radius:8px;border:1px solid var(--border)">`;
            $('#imgOut').textContent = dataUri;
            $('#imgInfo').textContent = `文件: ${file.name} | 大小: ${(file.size/1024).toFixed(1)} KB | Base64 长度: ${dataUri.length} 字符`;
            addCopyBtn('imgOut');
        };
        reader.readAsDataURL(file);
    };
};

// ---------- JSON → TypeScript ----------
TOOL_RENDERERS.json2ts = function(el) {
    el.innerHTML = `
        ${makePanel('输入 JSON', '<textarea id="j2tIn" placeholder="粘贴 JSON 数据..."></textarea>')}
        <div class="btn-group">
            <button class="btn btn-primary" id="j2tConvert">🔷 生成 TypeScript</button>
        </div>
        ${makePanel('TypeScript 类型定义', makeResult('j2tOut'))}
    `;
    function jsonToTs(obj, name = 'Root', indent = '') {
        let lines = [`${indent}interface ${name} {`];
        for (const [key, val] of Object.entries(obj)) {
            const type = getTsType(val, capitalize(key), indent + '  ');
            lines.push(`${indent}  ${key}: ${type.name};`);
            if (type.extra) lines = [...type.extra, '', ...lines];
        }
        lines.push(`${indent}}`);
        return lines;
    }
    function getTsType(val, name, indent) {
        if (val === null) return { name: 'null' };
        if (Array.isArray(val)) {
            if (val.length === 0) return { name: 'any[]' };
            const inner = getTsType(val[0], name + 'Item', indent);
            return { name: inner.name + '[]', extra: inner.extra };
        }
        if (typeof val === 'object') {
            const extra = jsonToTs(val, name, indent);
            return { name, extra };
        }
        return { name: typeof val };
    }
    function capitalize(s) { return s.charAt(0).toUpperCase() + s.slice(1); }
    $('#j2tConvert').onclick = () => {
        try {
            const obj = JSON.parse($('#j2tIn').value);
            const lines = jsonToTs(obj);
            $('#j2tOut').textContent = lines.join('\n');
            addCopyBtn('j2tOut');
        } catch(e) { $('#j2tOut').innerHTML = `<span style="color:var(--red)">❌ ${e.message}</span>`; }
    };
};

// ---------- HTTP 状态码 ----------
TOOL_RENDERERS.httpcode = function(el) {
    const codes = [
        { code: 100, text: 'Continue', desc: '继续，客户端应继续请求', cat: '1xx 信息' },
        { code: 101, text: 'Switching Protocols', desc: '切换协议，如升级到 WebSocket', cat: '1xx 信息' },
        { code: 200, text: 'OK', desc: '请求成功，最常见的成功状态码', cat: '2xx 成功' },
        { code: 201, text: 'Created', desc: '资源创建成功，常用于 POST 请求', cat: '2xx 成功' },
        { code: 204, text: 'No Content', desc: '成功但无返回内容，常用于 DELETE', cat: '2xx 成功' },
        { code: 206, text: 'Partial Content', desc: '部分内容，用于断点续传', cat: '2xx 成功' },
        { code: 301, text: 'Moved Permanently', desc: '永久重定向，URL 已永久变更', cat: '3xx 重定向' },
        { code: 302, text: 'Found', desc: '临时重定向，URL 临时变更', cat: '3xx 重定向' },
        { code: 304, text: 'Not Modified', desc: '资源未修改，使用缓存', cat: '3xx 重定向' },
        { code: 307, text: 'Temporary Redirect', desc: '临时重定向，保持请求方法不变', cat: '3xx 重定向' },
        { code: 400, text: 'Bad Request', desc: '请求参数错误，服务器无法理解', cat: '4xx 客户端错误' },
        { code: 401, text: 'Unauthorized', desc: '未认证，需要登录', cat: '4xx 客户端错误' },
        { code: 403, text: 'Forbidden', desc: '已认证但无权限访问', cat: '4xx 客户端错误' },
        { code: 404, text: 'Not Found', desc: '资源不存在', cat: '4xx 客户端错误' },
        { code: 405, text: 'Method Not Allowed', desc: '请求方法不允许（如用 GET 访问只支持 POST 的接口）', cat: '4xx 客户端错误' },
        { code: 408, text: 'Request Timeout', desc: '请求超时', cat: '4xx 客户端错误' },
        { code: 409, text: 'Conflict', desc: '资源冲突，如重复创建', cat: '4xx 客户端错误' },
        { code: 413, text: 'Payload Too Large', desc: '请求体过大，如上传文件超限', cat: '4xx 客户端错误' },
        { code: 415, text: 'Unsupported Media Type', desc: 'Content-Type 不支持', cat: '4xx 客户端错误' },
        { code: 422, text: 'Unprocessable Entity', desc: '参数格式正确但语义错误', cat: '4xx 客户端错误' },
        { code: 429, text: 'Too Many Requests', desc: '请求频率超限（限流）', cat: '4xx 客户端错误' },
        { code: 500, text: 'Internal Server Error', desc: '服务器内部错误', cat: '5xx 服务端错误' },
        { code: 502, text: 'Bad Gateway', desc: '网关错误，上游服务无响应', cat: '5xx 服务端错误' },
        { code: 503, text: 'Service Unavailable', desc: '服务不可用，通常是过载或维护', cat: '5xx 服务端错误' },
        { code: 504, text: 'Gateway Timeout', desc: '网关超时，上游服务响应太慢', cat: '5xx 服务端错误' },
    ];
    const colorMap = { '1xx': 'var(--blue)', '2xx': 'var(--green)', '3xx': 'var(--orange)', '4xx': 'var(--red)', '5xx': '#dc2626' };
    el.innerHTML = `
        ${makePanel('搜索', '<input type="text" id="httpSearch" placeholder="输入状态码或关键词...">')}
        <div id="httpList"></div>
    `;
    const render = (filter = '') => {
        const f = filter.toLowerCase();
        const filtered = codes.filter(c => !f || String(c.code).includes(f) || c.text.toLowerCase().includes(f) || c.desc.includes(f));
        const groups = {};
        filtered.forEach(c => { if (!groups[c.cat]) groups[c.cat] = []; groups[c.cat].push(c); });
        $('#httpList').innerHTML = Object.entries(groups).map(([cat, items]) => `
            <div class="panel" style="margin-top:12px">
                <div class="panel-label">${cat}</div>
                ${items.map(c => {
                    const prefix = String(c.code).charAt(0) + 'xx';
                    return `<div class="result-box" style="margin-bottom:6px;padding:12px 14px">
                        <span style="font-weight:800;color:${colorMap[prefix]};font-size:16px;font-family:var(--mono)">${c.code}</span>
                        <span style="font-weight:600;margin-left:8px">${c.text}</span>
                        <div style="font-size:12px;color:var(--text-2);margin-top:4px">${c.desc}</div>
                    </div>`;
                }).join('')}
            </div>
        `).join('') || '<div style="padding:20px;text-align:center;color:var(--text-3)">没有匹配的状态码</div>';
    };
    render();
    $('#httpSearch').addEventListener('input', e => render(e.target.value.trim()));
};

// ---------- 文本去重排序 ----------
TOOL_RENDERERS.textdedup = function(el) {
    el.innerHTML = `
        ${makePanel('输入（每行一条）', '<textarea id="dedupIn" placeholder="每行一条数据..." style="min-height:150px"></textarea>')}
        <div class="btn-group">
            <button class="btn btn-primary" id="dedupDedup">🧹 去重</button>
            <button class="btn btn-outline" id="dedupSortAsc">↑ 正序</button>
            <button class="btn btn-outline" id="dedupSortDesc">↓ 倒序</button>
            <button class="btn btn-outline" id="dedupTrim">✂️ 去空行</button>
            <button class="btn btn-outline" id="dedupTrimSpace">去首尾空格</button>
        </div>
        ${makePanel('结果', makeResult('dedupOut'))}
        <div id="dedupInfo" style="font-size:12px;color:var(--text-3)"></div>
    `;
    const getLines = () => $('#dedupIn').value.split('\n');
    const show = (lines) => {
        $('#dedupOut').textContent = lines.join('\n');
        addCopyBtn('dedupOut');
    };
    $('#dedupDedup').onclick = () => {
        const orig = getLines();
        const result = [...new Set(orig)];
        show(result);
        $('#dedupInfo').textContent = `原始 ${orig.length} 行 → 去重后 ${result.length} 行，移除 ${orig.length - result.length} 行`;
    };
    $('#dedupSortAsc').onclick = () => show(getLines().sort());
    $('#dedupSortDesc').onclick = () => show(getLines().sort().reverse());
    $('#dedupTrim').onclick = () => show(getLines().filter(l => l.trim()));
    $('#dedupTrimSpace').onclick = () => show(getLines().map(l => l.trim()));
};

// ---------- 字符串 ↔ 数组 ----------
TOOL_RENDERERS.str2arr = function(el) {
    el.innerHTML = `
        ${makePanel('输入', '<textarea id="s2aIn" placeholder="输入逗号分隔的字符串或 JSON 数组..."></textarea>')}
        ${makePanel('分隔符', '<input type="text" id="s2aSep" value="," placeholder="分隔符（默认逗号）">')}
        <div class="btn-group">
            <button class="btn btn-primary" id="s2aToArr">字符串 → 数组</button>
            <button class="btn btn-green" id="s2aToStr">数组 → 字符串</button>
            <button class="btn btn-outline" id="s2aSqlIn">生成 SQL IN</button>
        </div>
        ${makePanel('结果', makeResult('s2aOut'))}
    `;
    $('#s2aToArr').onclick = () => {
        const sep = $('#s2aSep').value || ',';
        const items = $('#s2aIn').value.split(sep).map(s => s.trim()).filter(Boolean);
        $('#s2aOut').textContent = JSON.stringify(items, null, 2);
        addCopyBtn('s2aOut');
    };
    $('#s2aToStr').onclick = () => {
        try {
            const arr = JSON.parse($('#s2aIn').value);
            const sep = $('#s2aSep').value || ',';
            $('#s2aOut').textContent = arr.join(sep + ' ');
            addCopyBtn('s2aOut');
        } catch(e) { $('#s2aOut').innerHTML = `<span style="color:var(--red)">❌ 请输入有效的 JSON 数组</span>`; }
    };
    $('#s2aSqlIn').onclick = () => {
        const sep = $('#s2aSep').value || ',';
        const items = $('#s2aIn').value.split(sep).map(s => s.trim()).filter(Boolean);
        const sqlIn = items.map(s => /^\d+$/.test(s) ? s : `'${s}'`).join(', ');
        $('#s2aOut').textContent = `IN (${sqlIn})`;
        addCopyBtn('s2aOut');
    };
};

// ---------- 密码正则生成器 ----------
TOOL_RENDERERS.pwdregex = function(el) {
    el.innerHTML = `
        ${makePanel('密码规则设置', `
            <div style="display:flex;flex-direction:column;gap:14px">
                <div class="panel-row" style="align-items:center">
                    <div class="panel-col">
                        <div class="panel-label" style="margin-bottom:4px">最少位数</div>
                        <input type="number" id="pwrMin" value="8" min="1" max="128">
                    </div>
                    <div class="panel-col">
                        <div class="panel-label" style="margin-bottom:4px">最多位数</div>
                        <input type="number" id="pwrMax" value="20" min="1" max="128">
                    </div>
                </div>
                <div style="display:flex;flex-direction:column;gap:10px" id="pwrRules">
                    <label class="pwr-rule"><input type="checkbox" id="pwrLower" checked><span class="pwr-check"></span><span>必须包含小写字母 <code>a-z</code></span></label>
                    <label class="pwr-rule"><input type="checkbox" id="pwrUpper" checked><span class="pwr-check"></span><span>必须包含大写字母 <code>A-Z</code></span></label>
                    <label class="pwr-rule"><input type="checkbox" id="pwrDigit" checked><span class="pwr-check"></span><span>必须包含数字 <code>0-9</code></span></label>
                    <label class="pwr-rule"><input type="checkbox" id="pwrSpecial" checked><span class="pwr-check"></span><span>必须包含特殊符号</span></label>
                    <div id="pwrSpecialChars" style="padding-left:32px">
                        <input type="text" id="pwrSymbols" value="!@#$%^&*()_+-=[]{}|;:,.<>?" placeholder="自定义特殊符号字符集" style="font-size:12px">
                    </div>
                    <label class="pwr-rule"><input type="checkbox" id="pwrNoSpace"><span class="pwr-check"></span><span>不允许空格</span></label>
                    <label class="pwr-rule"><input type="checkbox" id="pwrStart"><span class="pwr-check"></span><span>必须以字母开头</span></label>
                </div>
            </div>
        `)}
        <div class="btn-group">
            <button class="btn btn-primary" id="pwrGenerate">🔐 生成正则</button>
            <button class="btn btn-outline" id="pwrCopy">📋 复制</button>
        </div>
        ${makePanel('生成的正则', makeResult('pwrOutput'))}
        ${makePanel('规则说明', '<div id="pwrDesc" style="font-size:13px;color:var(--text-2);line-height:1.8"></div>')}
        ${makePanel('实时测试', `
            <input type="text" id="pwrTest" placeholder="输入密码测试是否符合规则...">
            <div id="pwrTestResult" style="margin-top:10px;font-size:13px"></div>
        `)}
        ${makePanel('常见密码规则预设', `
            <div id="pwrPresets" style="display:flex;flex-direction:column;gap:6px"></div>
        `)}
    `;

    const presets = [
        { name: '简单（6位以上，含字母和数字）', min:6, max:20, lower:true, upper:false, digit:true, special:false, noSpace:false, start:false },
        { name: '中等（8位以上，含大小写和数字）', min:8, max:20, lower:true, upper:true, digit:true, special:false, noSpace:false, start:false },
        { name: '强（8位以上，含大小写、数字和符号）', min:8, max:32, lower:true, upper:true, digit:true, special:true, noSpace:true, start:false },
        { name: '银行级（8-20位，字母开头，含大小写、数字和符号）', min:8, max:20, lower:true, upper:true, digit:true, special:true, noSpace:true, start:true },
        { name: '纯数字PIN（6位）', min:6, max:6, lower:false, upper:false, digit:true, special:false, noSpace:true, start:false },
    ];

    // 渲染预设
    $('#pwrPresets').innerHTML = presets.map((p, i) => `
        <div class="result-box" style="padding:10px 14px;cursor:pointer;position:relative" data-preset="${i}">
            <div style="font-size:13px;font-weight:600">${p.name}</div>
        </div>
    `).join('');

    $('#pwrPresets').addEventListener('click', e => {
        const el = e.target.closest('[data-preset]');
        if (!el) return;
        const p = presets[parseInt(el.dataset.preset)];
        $('#pwrMin').value = p.min;
        $('#pwrMax').value = p.max;
        $('#pwrLower').checked = p.lower;
        $('#pwrUpper').checked = p.upper;
        $('#pwrDigit').checked = p.digit;
        $('#pwrSpecial').checked = p.special;
        $('#pwrNoSpace').checked = p.noSpace;
        $('#pwrStart').checked = p.start;
        updateSpecialVisibility();
        generate();
    });

    function updateSpecialVisibility() {
        $('#pwrSpecialChars').style.display = $('#pwrSpecial').checked ? '' : 'none';
    }
    $('#pwrSpecial').addEventListener('change', updateSpecialVisibility);
    updateSpecialVisibility();

    function generate() {
        const min = parseInt($('#pwrMin').value) || 1;
        const max = parseInt($('#pwrMax').value) || 128;
        const lower = $('#pwrLower').checked;
        const upper = $('#pwrUpper').checked;
        const digit = $('#pwrDigit').checked;
        const special = $('#pwrSpecial').checked;
        const noSpace = $('#pwrNoSpace').checked;
        const startLetter = $('#pwrStart').checked;
        const symbols = $('#pwrSymbols').value;

        // 构建正则
        let lookaheads = '';
        let desc = [];

        if (lower) { lookaheads += '(?=.*[a-z])'; desc.push('至少 1 个小写字母'); }
        if (upper) { lookaheads += '(?=.*[A-Z])'; desc.push('至少 1 个大写字母'); }
        if (digit) { lookaheads += '(?=.*\\d)'; desc.push('至少 1 个数字'); }
        if (special && symbols) {
            const escaped = symbols.replace(/[-[\]{}()*+?.,\\^$|#]/g, '\\$&');
            lookaheads += '(?=.*[' + escaped + '])';
            desc.push('至少 1 个特殊符号 (' + symbols + ')');
        }

        // 允许的字符集
        let charset = '';
        if (startLetter) {
            desc.push('必须以字母开头');
        }
        if (noSpace) {
            charset = '\\S';
            desc.push('不允许空格');
        } else {
            charset = '.';
        }

        const lenPart = min === max ? `{${min}}` : `{${min},${max}}`;
        desc.push(`长度 ${min}-${max} 位`);

        let regex;
        if (startLetter) {
            const remaining = Math.max(min - 1, 0);
            const remainingMax = Math.max(max - 1, 0);
            const remLen = remaining === remainingMax ? `{${remaining}}` : `{${remaining},${remainingMax}}`;
            regex = `^${lookaheads}[a-zA-Z]${charset}${remLen}$`;
        } else {
            regex = `^${lookaheads}${charset}${lenPart}$`;
        }

        $('#pwrOutput').textContent = regex;
        currentRegex = regex;
        addCopyBtn('pwrOutput');

        $('#pwrDesc').innerHTML = desc.map(d => `✅ ${d}`).join('<br>');

        // 如果测试框有内容，自动测试
        testPassword();
    }

    // 存储当前生成的正则
    let currentRegex = '';

    function testPassword() {
        const pwd = $('#pwrTest').value;
        if (!pwd || !currentRegex) {
            $('#pwrTestResult').innerHTML = '';
            return;
        }
        try {
            const re = new RegExp(currentRegex);
            const pass = re.test(pwd);

            // 逐项检查
            let checks = [];
            const lower = $('#pwrLower').checked;
            const upper = $('#pwrUpper').checked;
            const digit = $('#pwrDigit').checked;
            const special = $('#pwrSpecial').checked;
            const noSpace = $('#pwrNoSpace').checked;
            const startLetter = $('#pwrStart').checked;
            const min = parseInt($('#pwrMin').value) || 1;
            const max = parseInt($('#pwrMax').value) || 128;

            checks.push({ rule: `长度 ${min}-${max} 位（当前 ${pwd.length} 位）`, ok: pwd.length >= min && pwd.length <= max });
            if (lower) checks.push({ rule: '包含小写字母', ok: /[a-z]/.test(pwd) });
            if (upper) checks.push({ rule: '包含大写字母', ok: /[A-Z]/.test(pwd) });
            if (digit) checks.push({ rule: '包含数字', ok: /\d/.test(pwd) });
            if (special) {
                const syms = $('#pwrSymbols').value;
                const escaped = syms.replace(/[-[\]{}()*+?.,\\^$|#]/g, '\\$&');
                checks.push({ rule: '包含特殊符号', ok: new RegExp('[' + escaped + ']').test(pwd) });
            }
            if (noSpace) checks.push({ rule: '不含空格', ok: !/\s/.test(pwd) });
            if (startLetter) checks.push({ rule: '以字母开头', ok: /^[a-zA-Z]/.test(pwd) });

            const html = `
                <div style="font-weight:700;font-size:15px;margin-bottom:8px;color:${pass ? 'var(--green)' : 'var(--red)'}">
                    ${pass ? '✅ 密码符合规则' : '❌ 密码不符合规则'}
                </div>
                ${checks.map(c => `<div style="padding:3px 0;color:${c.ok ? 'var(--green)' : 'var(--red)'}">
                    ${c.ok ? '✓' : '✗'} ${c.rule}
                </div>`).join('')}
            `;
            $('#pwrTestResult').innerHTML = html;
        } catch(e) {
            $('#pwrTestResult').innerHTML = `<span style="color:var(--red)">正则语法错误</span>`;
        }
    }

    $('#pwrGenerate').onclick = generate;
    $('#pwrCopy').onclick = () => copyText($('#pwrOutput').textContent);
    $('#pwrTest').addEventListener('input', testPassword);

    // 初始生成一次
    generate();
};
