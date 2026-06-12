// ===== AI 起名大师 - DeepSeek API 版 =====

// 状态
let state = {
  surname: '',
  gender: '不限',
  style: '诗经楚辞',
  birthdate: '',
  names: [],
  freeCount: parseInt(localStorage.getItem('name_gen_count') || '0'),
  maxFree: 3
};

// API Key 管理
let apiKey = localStorage.getItem('ds_api_key') || '';

function toggleApiSettings() {
  const el = document.getElementById('api-settings');
  const btn = document.querySelector('.api-toggle');
  if (el.style.display === 'none') {
    el.style.display = 'block';
    btn.classList.add('active');
  } else {
    el.style.display = 'none';
    btn.classList.remove('active');
  }
}

function saveApiKey() {
  const key = document.getElementById('api-key').value.trim();
  const statusEl = document.getElementById('api-status');
  if (!key) {
    apiKey = '';
    localStorage.removeItem('ds_api_key');
    statusEl.textContent = '已清除 API Key（使用内置算法）';
    statusEl.className = '';
    return;
  }
  if (!key.startsWith('sk-')) {
    statusEl.textContent = '⚠️ Key 格式不正确，应以 sk- 开头';
    statusEl.className = 'error';
    return;
  }
  apiKey = key;
  localStorage.setItem('ds_api_key', key);
  statusEl.textContent = '✅ API Key 已保存';
  statusEl.className = 'success';
  document.querySelector('.api-toggle').classList.add('active');
}

// 初始化：检查已保存的 key
function initApiSettings() {
  if (apiKey) {
    document.getElementById('api-key').value = apiKey;
    document.querySelector('.api-toggle').classList.add('active');
    document.getElementById('api-status').textContent = '✅ 已配置';
    document.getElementById('api-status').className = 'success';
  }
}

// ===== DeepSeek API 调用 =====
async function callDeepSeek(prompt) {
  const response = await fetch('https://api.deepseek.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      model: 'deepseek-chat',
      messages: [
        { role: 'system', content: '你是一位精通中国传统文化、诗经楚辞、唐诗宋词、八字五行的起名大师。你为宝宝起的名字必须寓意深刻、音韵优美、有典籍出处。你只返回 JSON 格式的结果，不返回其他内容。' },
        { role: 'user', content: prompt }
      ],
      temperature: 0.9,
      max_tokens: 2000,
      response_format: { type: 'json_object' }
    })
  });

  if (!response.ok) {
    const err = await response.text();
    throw new Error(`API 错误 (${response.status}): ${err}`);
  }

  const data = await response.json();
  const content = data.choices[0].message.content;
  return JSON.parse(content);
}

function buildPrompt(surname, gender, style, birthdate) {
  let prompt = `请为姓氏为"${surname}"`;

  if (gender === '男') prompt += '的男宝宝';
  else if (gender === '女') prompt += '的女宝宝';
  else prompt += '的宝宝';

  prompt += `起8个好名字。\n`;
  prompt += `起名风格：${style}。\n`;

  if (birthdate) {
    prompt += `出生日期：${birthdate}。请结合八字五行分析，给出五行补缺建议。\n`;
  }

  prompt += `\n要求：
- 每个名字包含：名字全称（姓+名）、名字寓意（50字以内）、名字评分（1-100）、五行属性（金木水火土之一）
- 优先从${style}中选取有典故的名字
- 如果提供了出生日期，注明八字分析和五行补缺建议
- 选1-2个最佳名字标记为推荐

请严格按以下JSON格式返回：
{
  "names": [
    {
      "givenName": "名",
      "meaning": "寓意描述",
      "score": 95,
      "element": "金",
      "source": "《诗经·大雅》\"思齐大任，文王之母\"",
      "isFeatured": true
    }
  ],
  "wuxingAnalysis": "八字分析（如有）"
}`;

  return prompt;
}

// ===== 字符数据库（API 不可用时的降级方案） =====
const CHAR_DB = {
  male: [
    { char: '宇', meaning: '气宇轩昂，胸怀宽广', element: '土', score: 95, pinyin: 'yǔ' },
    { char: '轩', meaning: '气度不凡，高大英俊', element: '木', score: 93, pinyin: 'xuān' },
    { char: '泽', meaning: '恩泽广布，温润如玉', element: '水', score: 94, pinyin: 'zé' },
    { char: '宸', meaning: '帝王居所，尊贵非凡', element: '金', score: 96, pinyin: 'chén' },
    { char: '铭', meaning: '铭记于心，才德出众', element: '金', score: 92, pinyin: 'míng' },
    { char: '昊', meaning: '天空广阔，志向远大', element: '火', score: 91, pinyin: 'hào' },
    { char: '哲', meaning: '智慧明达，深谋远虑', element: '火', score: 93, pinyin: 'zhé' },
    { char: '博', meaning: '学识渊博，见多识广', element: '水', score: 90, pinyin: 'bó' },
    { char: '瑞', meaning: '吉祥如意，福泽深厚', element: '金', score: 94, pinyin: 'ruì' },
    { char: '霖', meaning: '甘霖普降，恩泽万物', element: '水', score: 95, pinyin: 'lín' },
    { char: '彦', meaning: '才德出众之士', element: '木', score: 88, pinyin: 'yàn' },
    { char: '皓', meaning: '洁白明亮，光明磊落', element: '火', score: 91, pinyin: 'hào' },
    { char: '睿', meaning: '睿智通达，明察秋毫', element: '金', score: 96, pinyin: 'ruì' },
    { char: '煜', meaning: '光明照耀，前程似锦', element: '火', score: 90, pinyin: 'yù' },
    { char: '毅', meaning: '刚强果断，坚韧不拔', element: '木', score: 89, pinyin: 'yì' },
  ],
  female: [
    { char: '涵', meaning: '内涵丰富，温柔包容', element: '水', score: 95, pinyin: 'hán' },
    { char: '诗', meaning: '诗情画意，文雅动人', element: '金', score: 94, pinyin: 'shī' },
    { char: '瑶', meaning: '美玉无瑕，珍贵美好', element: '木', score: 93, pinyin: 'yáo' },
    { char: '语', meaning: '妙语连珠，聪慧灵动', element: '木', score: 90, pinyin: 'yǔ' },
    { char: '悦', meaning: '喜悦欢欣，乐观开朗', element: '金', score: 91, pinyin: 'yuè' },
    { char: '晴', meaning: '晴空万里，明朗灿烂', element: '火', score: 89, pinyin: 'qíng' },
    { char: '若', meaning: '温婉如兰，宛若天仙', element: '木', score: 92, pinyin: 'ruò' },
    { char: '汐', meaning: '潮汐之美，温柔灵动', element: '水', score: 90, pinyin: 'xī' },
    { char: '颖', meaning: '聪颖过人，才思敏捷', element: '木', score: 92, pinyin: 'yǐng' },
    { char: '琳', meaning: '琳琅满目，珍贵华美', element: '木', score: 88, pinyin: 'lín' },
    { char: '妤', meaning: '古代女官名，端庄典雅', element: '水', score: 91, pinyin: 'yú' },
    { char: '舒', meaning: '从容舒展，岁月静好', element: '金', score: 93, pinyin: 'shū' },
    { char: '宁', meaning: '安宁祥和，心境平和', element: '火', score: 94, pinyin: 'níng' },
    { char: '婉', meaning: '温婉可人，柔美优雅', element: '土', score: 90, pinyin: 'wǎn' },
    { char: '婧', meaning: '女子有才，身姿优美', element: '木', score: 87, pinyin: 'jìng' },
  ],
  neutral: [
    { char: '文', meaning: '文采斐然，气质儒雅', element: '水', score: 90, pinyin: 'wén' },
    { char: '安', meaning: '平安顺遂，岁月静好', element: '土', score: 91, pinyin: 'ān' },
    { char: '逸', meaning: '超凡脱俗，潇洒飘逸', element: '土', score: 92, pinyin: 'yì' },
    { char: '然', meaning: '自然坦荡，泰然自若', element: '金', score: 88, pinyin: 'rán' },
    { char: '远', meaning: '志向高远，前程远大', element: '土', score: 89, pinyin: 'yuǎn' },
    { char: '思', meaning: '才思敏捷，深思熟虑', element: '金', score: 90, pinyin: 'sī' },
    { char: '明', meaning: '光明磊落，明白事理', element: '火', score: 91, pinyin: 'míng' },
    { char: '乐', meaning: '乐观向上，快乐常在', element: '火', score: 90, pinyin: 'lè' },
    { char: '晨', meaning: '晨光熹微，朝气蓬勃', element: '火', score: 89, pinyin: 'chén' },
    { char: '一', meaning: '专一纯粹，大道至简', element: '水', score: 93, pinyin: 'yī' },
  ]
};

const POETRY = [
  { name: '思齐', source: '《诗经·大雅》"思齐大任，文王之母"', meaning: '见贤思齐，端庄贤淑' },
  { name: '燕飞', source: '《诗经·邶风》"燕燕于飞，差池其羽"', meaning: '自由翱翔，无拘无束' },
  { name: '清扬', source: '《诗经·郑风》"有美一人，清扬婉兮"', meaning: '眉清目秀，温婉动人' },
  { name: '明哲', source: '《诗经·大雅》"既明且哲，以保其身"', meaning: '明达智慧，安身立命' },
  { name: '子衿', source: '《诗经·郑风》"青青子衿，悠悠我心"', meaning: '才华出众，令人倾慕' },
  { name: '静姝', source: '《诗经·邶风》"静女其姝，俟我于城隅"', meaning: '娴静美好，温婉可人' },
  { name: '景行', source: '《诗经·小雅》"高山仰止，景行行止"', meaning: '品德高尚，行为端正' },
  { name: '望舒', source: '《楚辞·离骚》"前望舒使先驱兮"', meaning: '月神之名，光明在前' },
  { name: '正则', source: '《楚辞·离骚》"名余曰正则兮"', meaning: '公平正直，守正不阿' },
  { name: '灵均', source: '《楚辞·离骚》"字余曰灵均兮"', meaning: '灵秀聪慧，均衡和谐' },
];

const TANG_SONG = [
  { name: '云帆', source: '李白《行路难》"长风破浪会有时，直挂云帆济沧海"', meaning: '扬帆远航，志向远大' },
  { name: '锦瑟', source: '李商隐《锦瑟》"锦瑟无端五十弦"', meaning: '精致华美，意境深远' },
  { name: '清欢', source: '苏轼《浣溪沙》"人间有味是清欢"', meaning: '清雅淡泊，知足常乐' },
  { name: '如初', source: '纳兰性德《木兰花令》"人生若只如初见"', meaning: '初心不改，始终如一' },
  { name: '千帆', source: '温庭筠《望江南》"过尽千帆皆不是"', meaning: '历经世事，终得所愿' },
  { name: '若兰', source: '王勃《滕王阁序》"气若兰兮长不改"', meaning: '气质如兰，芬芳永恒' },
  { name: '凌云', source: '杜甫《望岳》"会当凌绝顶，一览众山小"', meaning: '壮志凌云，登峰造极' },
  { name: '听雨', source: '蒋捷《虞美人》"少年听雨歌楼上"', meaning: '诗意生活，感悟人生' },
];

const GRAND = [
  { name: '浩然', meaning: '浩然正气，胸怀坦荡', source: '《孟子》"吾善养吾浩然之气"' },
  { name: '鹏飞', meaning: '大鹏展翅，翱翔九天', source: '《庄子·逍遥游》' },
  { name: '海川', meaning: '海纳百川，有容乃大', source: '林则徐名联' },
  { name: '天阔', meaning: '天地广阔，自由驰骋', source: '柳永《雨霖铃》"暮霭沉沉楚天阔"' },
];

// ===== 五行计算 =====
function calcFiveElements(birthdate) {
  if (!birthdate) return null;
  const date = new Date(birthdate);
  const year = date.getFullYear();
  const tiangan = (year - 4) % 10;
  const tgElements = ['木','木','火','火','土','土','金','金','水','水'];
  const dizhi = (year - 4) % 12;
  const dzElements = ['水','土','木','木','土','火','火','土','金','金','土','水'];

  return {
    yearElement: tgElements[tiangan],
    monthElement: ['木','木','火','火','土','土','金','金','水','水','土','水'][date.getMonth()],
    dayElement: tgElements[date.getDate() % 10],
    dominant: tgElements[tiangan],
    lacking: findLacking([tgElements[tiangan], dzElements[dizhi]])
  };
}

function findLacking(elements) {
  const all = ['金','木','水','火','土'];
  const has = new Set(elements);
  return all.filter(e => !has.has(e));
}

// ===== 内置名字生成引擎（降级方案） =====
function generateNamesBuiltin(surname, gender, style, birthdate) {
  const names = [];
  const wuxing = calcFiveElements(birthdate);
  let charPool = [...CHAR_DB.neutral];
  if (gender === '男') charPool = [...CHAR_DB.male, ...CHAR_DB.neutral];
  else if (gender === '女') charPool = [...CHAR_DB.female, ...CHAR_DB.neutral];
  else charPool = [...CHAR_DB.male, ...CHAR_DB.female, ...CHAR_DB.neutral];

  let wuxingChars = charPool;
  if (wuxing && wuxing.lacking.length > 0) {
    const supplement = charPool.filter(c => c.element === wuxing.lacking[0]);
    if (supplement.length >= 3) {
      wuxingChars = [...supplement, ...charPool.filter(c => c.element !== wuxing.lacking[0] && c.score >= 92)];
    }
  }

  const usedNames = new Set();
  let poetryPool = [];
  if (style === '诗经楚辞') poetryPool = POETRY;
  else if (style === '唐诗宋词') poetryPool = TANG_SONG;
  else if (style === '大气磅礴') poetryPool = GRAND;
  else poetryPool = [...POETRY, ...TANG_SONG];

  const shuffledPoetry = shuffle([...poetryPool]);
  for (let i = 0; i < Math.min(4, shuffledPoetry.length); i++) {
    const p = shuffledPoetry[i];
    const fullName = surname + p.name;
    if (!usedNames.has(fullName)) {
      usedNames.add(fullName);
      const firstChar = charPool.find(c => c.char === p.name[0]) || { element: '土', score: 90 };
      names.push({
        name: fullName, givenName: p.name,
        meaning: p.meaning, source: p.source,
        score: 90 + Math.floor(Math.random() * 9),
        element: wuxing ? (wuxing.lacking[0] || firstChar.element) : firstChar.element,
        style: style,
        wuxingNote: wuxing ? `八字${wuxing.dominant}命，${wuxing.lacking.length > 0 ? '补' + wuxing.lacking[0] : '五行均衡'}` : '',
        isFeatured: i === 0
      });
    }
  }

  const shuffled = shuffle([...wuxingChars]);
  for (let i = 0; i < shuffled.length - 1 && names.length < 12; i++) {
    for (let j = i + 1; j < shuffled.length && names.length < 12; j++) {
      const a = shuffled[i], b = shuffled[j];
      const combos = [
        { given: a.char, meaning: a.meaning, chars: [a] },
        { given: b.char, meaning: b.meaning, chars: [b] },
        { given: a.char + b.char, meaning: `${a.meaning.split('，')[0]}，${b.meaning.split('，')[0]}`.slice(0, 30), chars: [a, b] },
        { given: b.char + a.char, meaning: `${b.meaning.split('，')[0]}，${a.meaning.split('，')[0]}`.slice(0, 30), chars: [b, a] },
      ];
      for (const combo of combos) {
        const fullName = surname + combo.given;
        if (usedNames.has(fullName)) continue;
        if (names.length >= 12) break;
        usedNames.add(fullName);
        const avgScore = Math.round(combo.chars.reduce((s, c) => s + c.score, 0) / combo.chars.length);
        const boost = (wuxing && combo.chars.some(c => wuxing.lacking.includes(c.element))) ? 4 : 0;
        const pinyin = combo.chars.map(c => c.pinyin).join('');
        names.push({
          name: fullName, givenName: combo.given, pinyin,
          meaning: combo.meaning, source: '',
          score: Math.min(99, avgScore + boost + Math.floor(Math.random() * 4)),
          element: combo.chars[0].element, style,
          wuxingNote: wuxing ? `八字${wuxing.dominant}命，${wuxing.lacking.length > 0 ? '补' + wuxing.lacking.join('、') : '五行均衡'}` : '',
          isFeatured: false
        });
      }
    }
  }

  names.sort((a, b) => b.score - a.score);
  if (names.length > 0) names[0].isFeatured = true;
  if (names.length > 1 && names[1].score >= 94) names[1].isFeatured = true;
  return names.slice(0, 10);
}

function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// ===== 主生成函数 =====
async function generateNames(surname, gender, style, birthdate) {
  // 优先使用 DeepSeek API
  if (apiKey) {
    try {
      const prompt = buildPrompt(surname, gender, style, birthdate);
      const result = await callDeepSeek(prompt);

      if (result && result.names && result.names.length > 0) {
        return result.names.map((n, i) => ({
          name: surname + n.givenName,
          givenName: n.givenName,
          meaning: n.meaning || '',
          source: n.source || '',
          score: n.score || 90,
          element: n.element || '木',
          style: style,
          isFeatured: n.isFeatured || i === 0,
          wuxingNote: result.wuxingAnalysis || '',
          aiGenerated: true
        }));
      }
    } catch (err) {
      console.warn('AI API 调用失败，使用内置算法:', err.message);
      // API 失败 → 降级到内置算法
      const names = generateNamesBuiltin(surname, gender, style, birthdate);
      names.forEach(n => n.aiGenerated = false);
      return names;
    }
  }

  // 无 API Key → 内置算法
  const names = generateNamesBuiltin(surname, gender, style, birthdate);
  names.forEach(n => n.aiGenerated = false);
  return names;
}

// ===== UI 逻辑 =====
function showScreen(id) {
  document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
  document.getElementById(id).classList.add('active');
  window.scrollTo(0, 0);
}

function toast(msg) {
  const t = document.createElement('div');
  t.className = 'toast';
  t.textContent = msg;
  document.body.appendChild(t);
  setTimeout(() => t.remove(), 2000);
}

// 性别选择
document.querySelectorAll('.gender-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    btn.parentElement.querySelectorAll('.gender-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    state.gender = btn.dataset.gender;
  });
});

// 风格选择
document.querySelectorAll('.chip').forEach(chip => {
  chip.addEventListener('click', () => {
    chip.parentElement.querySelectorAll('.chip').forEach(c => c.classList.remove('active'));
    chip.classList.add('active');
    state.style = chip.dataset.style;
  });
});

// 生成按钮
document.getElementById('generate-btn').addEventListener('click', async () => {
  const surname = document.getElementById('surname').value.trim();
  if (!surname) {
    toast('请输入姓氏');
    document.getElementById('surname').focus();
    return;
  }
  if (!/^[一-龥]{1,2}$/.test(surname)) {
    toast('请输入中文姓氏');
    return;
  }

  state.surname = surname;
  state.birthdate = document.getElementById('birthdate').value;
  state.freeCount++;
  localStorage.setItem('name_gen_count', state.freeCount);

  // 显示加载页
  showScreen('loading-screen');

  // 更新加载文案
  const mainText = document.getElementById('loading-main-text');
  const subText = document.getElementById('loading-sub-text');
  if (apiKey) {
    mainText.textContent = '🤖 AI 大模型正在起名...';
    subText.textContent = 'DeepSeek 结合典籍与八字，精选好名';
  } else {
    mainText.textContent = 'AI 正在翻阅典籍...';
    subText.textContent = '结合八字五行，为你精选好名';
  }

  // 加载动画
  const stepAnalyze = document.getElementById('step-analyze');
  const stepGenerate = document.getElementById('step-generate');
  stepAnalyze.classList.remove('done', 'current');
  stepGenerate.classList.remove('done', 'current');

  setTimeout(() => { stepAnalyze.classList.add('done'); }, 600);
  setTimeout(() => { stepGenerate.classList.add('done'); }, 1200);

  try {
    state.names = await generateNames(state.surname, state.gender, state.style, state.birthdate);
  } catch (err) {
    console.error('生成失败:', err);
    toast('生成失败，请重试');
    showScreen('home-screen');
    return;
  }

  renderResults();
  showScreen('result-screen');
});

function renderResults() {
  const info = `${state.surname}姓${state.gender !== '不限' ? state.gender + '宝' : '宝宝'} · ${state.style}风格`;
  document.getElementById('result-info').textContent = info;

  // 标题
  const isAI = state.names.length > 0 && state.names[0].aiGenerated;
  document.getElementById('result-title').textContent = isAI ? '🤖 AI 为你精选的名字' : '为你精选的名字';

  const list = document.getElementById('name-list');
  list.innerHTML = state.names.map((n, i) => `
    <div class="name-card ${n.isFeatured ? 'featured' : ''}" onclick="showDetail(${i})">
      ${n.isFeatured ? '<span class="featured-tag">🏆 推荐</span>' : ''}
      ${n.aiGenerated ? '<span class="featured-tag" style="background:#6C5CE7;">🤖 AI生成</span>' : ''}
      <div class="name-main">
        <span class="name-text">${n.name}</span>
        ${n.pinyin ? `<span class="name-pinyin">${n.pinyin}</span>` : ''}
      </div>
      <div class="name-tags">
        <span class="tag tag-score">⭐ ${n.score}分</span>
        <span class="tag tag-element">${n.element}属性</span>
        <span class="tag tag-style">${n.style}</span>
      </div>
      <div class="name-meaning">${n.meaning}</div>
      ${n.source ? `<div class="name-source">📖 ${n.source}</div>` : ''}
      ${n.wuxingNote ? `<div style="font-size:12px;color:#B8860B;margin-top:4px;">🧮 ${n.wuxingNote}</div>` : ''}
      <div class="name-actions">
        <button onclick="event.stopPropagation();copyName('${n.name}')">📋 复制</button>
        <button onclick="event.stopPropagation();showDetail(${i})">🔍 详情</button>
        <button onclick="event.stopPropagation();favoriteName(${i})">❤️ 收藏</button>
      </div>
    </div>
  `).join('');

  // 升级卡片
  if (state.freeCount >= state.maxFree) {
    document.getElementById('upgrade-card').style.display = 'block';
  }
}

function showDetail(index) {
  const n = state.names[index];
  if (!n) return;
  const wuxing = calcFiveElements(state.birthdate);

  document.getElementById('detail-content').innerHTML = `
    <div class="detail-name">${n.name}</div>
    ${n.pinyin ? `<div class="detail-pinyin">${n.pinyin}</div>` : ''}
    <div class="detail-section">
      <h4>📊 综合评分</h4>
      <div class="detail-grid">
        <div class="item"><div class="label">综合得分</div><div class="value">⭐ ${n.score}/100</div></div>
        <div class="item"><div class="label">五行属性</div><div class="value">${n.element}</div></div>
        <div class="item"><div class="label">音韵评分</div><div class="value">🎵 ${Math.min(99, n.score + Math.floor(Math.random()*5))}/100</div></div>
        <div class="item"><div class="label">寓意评分</div><div class="value">💎 ${Math.min(99, n.score + Math.floor(Math.random()*3))}/100</div></div>
      </div>
    </div>
    <div class="detail-section">
      <h4>📖 名字释义</h4>
      <p>${n.meaning}</p>
    </div>
    ${n.source ? `<div class="detail-section"><h4>📚 典籍出处</h4><p>${n.source}</p></div>` : ''}
    <div class="detail-section">
      <h4>🧮 八字五行分析</h4>
      <p>${n.wuxingNote || (wuxing ? `生于${state.birthdate}，八字${wuxing.dominant}命。${wuxing.lacking.length > 0 ? '八字中缺' + wuxing.lacking.join('、') + '，取名宜补' + wuxing.lacking[0] + '。' : '五行均衡，取名可选任意属性。'}` : '未填写出生日期，无法进行八字分析。')}</p>
    </div>
    <div class="detail-section">
      <h4>✍️ 字形分析</h4>
      <p>${n.givenName.length > 0 ? n.givenName.split('').map(c => `"${c}"(${getStrokeHint(c)}画)`).join('，') : ''}。${strokeAdvice(n.name)}</p>
    </div>
    <div class="detail-section">
      <h4>🔮 名字运势解读</h4>
      <p style="color:#AAA;font-style:italic;">🔒 深度运势解读需升级会员查看</p>
    </div>
  `;

  document.getElementById('detail-modal').classList.add('show');
}

function closeDetail() { document.getElementById('detail-modal').classList.remove('show'); }

function getStrokeHint(char) {
  const map = { '宇':6,'轩':7,'泽':8,'宸':10,'铭':11,'昊':8,'哲':10,'博':12,'毅':15,'瑞':13,'霖':16,'彦':9,'皓':12,'睿':14,'煜':13,'涵':11,'诗':8,'瑶':14,'语':9,'悦':10,'晴':12,'若':8,'汐':6,'颖':13,'琳':12,'妤':7,'婧':11,'舒':12,'宁':5,'婉':11,'文':4,'安':6,'逸':11,'然':12,'远':7,'思':9,'明':8,'乐':5,'晨':11,'一':1,'子':3,'望':11,'景':12,'凯':8,'云':4,'锦':13,'如':6,'清':11,'千':3,'凌':10,'听':7,'海':10,'天':4,'浩':10,'鹏':13,'飞':3,'兰':5 };
  return map[char] || '?';
}

function strokeAdvice(name) {
  const total = name.split('').reduce((s, c) => s + (parseInt(getStrokeHint(c)) || 0), 0);
  if (total >= 20 && total <= 35) return '笔画数组合良好，书写流畅，视觉美观。';
  if (total < 15) return '笔画简洁，书写方便，适合现代快节奏生活。';
  return '笔画偏多但结构均衡，有传统书法的美感。';
}

function copyName(name) {
  navigator.clipboard.writeText(name).then(() => toast(`已复制：${name}`))
    .catch(() => {
      const input = document.createElement('input');
      input.value = name;
      document.body.appendChild(input);
      input.select();
      document.execCommand('copy');
      document.body.removeChild(input);
      toast(`已复制：${name}`);
    });
}

function favoriteName(index) {
  const n = state.names[index];
  const favs = JSON.parse(localStorage.getItem('fav_names') || '[]');
  if (favs.find(f => f.name === n.name)) { toast('已收藏过了'); return; }
  favs.push({ ...n, savedAt: new Date().toISOString() });
  localStorage.setItem('fav_names', JSON.stringify(favs));
  toast(`❤️ 已收藏：${n.name}`);
}

function shareResult() {
  if (!state.names.length) return;
  const top3 = state.names.slice(0, 3).map(n => `${n.name}（${n.score}分）`).join('、');
  const text = `🧧 AI起名大师帮我给宝宝起了几个好名字：\n${top3}\n\n你也来试试 → ${window.location.href}`;
  if (navigator.share) {
    navigator.share({ title: 'AI起名大师', text: text });
  } else {
    copyName(text);
    toast('已复制分享文案，去粘贴给朋友吧');
  }
}

function showUpgrade() {
  document.getElementById('upgrade-modal').classList.add('show');
}

function closeUpgrade() {
  document.getElementById('upgrade-modal').classList.remove('show');
}

function uploadQR() {
  const input = document.createElement('input');
  input.type = 'file';
  input.accept = 'image/*';
  input.onchange = function(e) {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = function(ev) {
      document.getElementById('payment-qr').src = ev.target.result;
      document.getElementById('payment-qr').style.display = 'block';
      document.getElementById('qr-placeholder').style.display = 'none';
      localStorage.setItem('payment_qr', ev.target.result);
      toast('✅ 收款码已保存（仅本机可见）');
    };
    reader.readAsDataURL(file);
  };
  input.click();
}

function loadPaymentQR() {
  const saved = localStorage.getItem('payment_qr');
  if (saved) {
    document.getElementById('payment-qr').src = saved;
    document.getElementById('payment-qr').style.display = 'block';
    document.getElementById('qr-placeholder').style.display = 'none';
  }
}

// 访问计数器
function updateVisitorCount() {
  let count = parseInt(localStorage.getItem('visitor_count') || '0');
  const today = new Date().toDateString();
  const lastVisit = localStorage.getItem('last_visit_date');
  if (lastVisit !== today) {
    count++;
    localStorage.setItem('visitor_count', count);
    localStorage.setItem('last_visit_date', today);
  }
  document.getElementById('visitor-count').textContent = count + 1580; // 基础数据
}

// 深度分析（调用 AI API 做详细解读）
async function deepAnalyze(nameData) {
  if (!apiKey) {
    toast('请先配置 AI API Key');
    return;
  }
  const prompt = `请对名字"${nameData.name}"做深度分析：
- 八字排盘与五行分析
- 名字与命运的关联解读
- 终身运势走向
- 字数200字以内`;

  try {
    const response = await fetch('https://api.deepseek.com/v1/chat/completions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${apiKey}` },
      body: JSON.stringify({
        model: 'deepseek-chat',
        messages: [
          { role: 'system', content: '你是精通八字命理的起名大师。简洁专业。' },
          { role: 'user', content: prompt }
        ],
        temperature: 0.7, max_tokens: 500
      })
    });
    const data = await response.json();
    return data.choices[0].message.content;
  } catch (err) {
    return null;
  }
}

function goHome() { showScreen('home-screen'); }

// 点击弹窗背景关闭
document.getElementById('detail-modal').addEventListener('click', function(e) {
  if (e.target === this) closeDetail();
});

// ===== 初始化 =====
initApiSettings();
updateVisitorCount();
console.log('🧧 AI起名大师已就绪');
console.log('🤖 DeepSeek API:', apiKey ? '已配置' : '未配置（使用内置算法）');
