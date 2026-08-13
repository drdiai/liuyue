// Socratic Math Tutor Application Logic (Grades 5 & 6)

// Grade and Topic mappings
const gradeTopics = {
  '5': [
    { value: 'chicken-rabbit', label: '鸡兔同笼 (经典假设法)' },
    { value: 'meet-problems', label: '路程相遇问题 (速度和模型)' },
    { value: 'simple-equations', label: '列方程解应用题 (等量关系建模)' },
    { value: 'polygon-areas', label: '组合多边形面积转化' }
  ],
  '6': [
    { value: 'work-problems', label: '工程合作问题 (工作效率分数模型)' },
    { value: 'ratio-proportions', label: '比与比例应用 (份数分配模型)' },
    { value: 'cylinder-volume', label: '圆柱切拼表面积与体积变化' },
    { value: 'percentage-change', label: '百分数增减变化分析' }
  ]
};

// Application State
let state = {
  theme: 'dark',
  apiConfig: {
    base: '',
    key: '',
    model: '',
    whisperModel: 'whisper-1'
  },
  currentGrade: '5',
  currentTopic: 'chicken-rabbit',
  socraticChatHistory: [],
  socraticRound: 0,
  isAnalyzing: false,
  isRecording: false,
  canvasHistory: [],
  isDrawing: false,
  lastX: 0,
  lastY: 0,
  penColor: '#1e293b', // Default pen color
  brushSize: 5        // Default brush size
};

// DOM References
const elements = {
  body: document.body,
  themeToggle: document.getElementById('btn-theme-toggle'),
  openConfigBtn: document.getElementById('btn-open-config'),
  closeConfigBtn: document.getElementById('btn-close-config'),
  cancelConfigBtn: document.getElementById('btn-cancel-config'),
  saveConfigBtn: document.getElementById('btn-save-config'),
  configModal: document.getElementById('config-modal'),
  apiBaseInput: document.getElementById('api-base'),
  apiKeyInput: document.getElementById('api-key'),
  apiModelInput: document.getElementById('api-model'),
  apiWhisperModelInput: document.getElementById('api-whisper-model'),
  
  selectGrade: document.getElementById('select-grade'),
  selectTopic: document.getElementById('select-topic'),
  btnStartTutor: document.getElementById('btn-start-tutor'),
  
  canvas: document.getElementById('math-canvas'),
  btnCanvasUndo: document.getElementById('btn-canvas-undo'),
  btnCanvasClear: document.getElementById('btn-canvas-clear'),
  btnCanvasExport: document.getElementById('btn-canvas-export'),
  
  chatHistory: document.getElementById('chat-history'),
  chatUserInput: document.getElementById('chat-user-input'),
  btnRecordMic: document.getElementById('btn-record-mic'),
  btnChatSend: document.getElementById('btn-chat-send'),
  btnChatReset: document.getElementById('btn-chat-reset'),
  
  chatLoading: document.getElementById('chat-loading-overlay'),
  chatLoadingText: document.getElementById('chat-loading-text'),
  tutorStatus: document.getElementById('tutor-status'),
  quickPills: document.getElementById('quick-pills'),
  
  toast: document.getElementById('toast-message'),
  offlineBanner: document.getElementById('offline-banner'),
  customProblemContainer: document.getElementById('custom-problem-container'),
  customProblemText: document.getElementById('custom-problem-text')
};



// Canvas drawing context
let ctx = null;

// Initialize Webpage
window.addEventListener('DOMContentLoaded', () => {
  initCanvas();
  loadConfig();
  loadTheme();
  setupEventListeners();
  updateTopics(); // Populate topics based on default grade
  
  // Parse URL parameters and automatically start if integrated
  parseUrlParamsAndStart();
});

// Load Config from LocalStorage
function loadConfig() {
  const savedBase = localStorage.getItem('socratic_api_base') || 'https://api.openai.com/v1';
  const savedKey = localStorage.getItem('socratic_api_key') || '';
  const savedModel = localStorage.getItem('socratic_api_model') || 'gpt-4o-mini';
  const savedWhisperModel = localStorage.getItem('socratic_api_whisper_model') || 'whisper-1';
  
  state.apiConfig = { base: savedBase, key: savedKey, model: savedModel, whisperModel: savedWhisperModel };
  
  elements.apiBaseInput.value = savedBase;
  elements.apiKeyInput.value = savedKey;
  elements.apiModelInput.value = savedModel;
  elements.apiWhisperModelInput.value = savedWhisperModel;
  
  // Toggle offline warning banner visibility
  if (!savedKey) {
    elements.offlineBanner.style.display = 'flex';
  } else {
    elements.offlineBanner.style.display = 'none';
  }
}


// Load Theme
function loadTheme() {
  const savedTheme = localStorage.getItem('socratic_theme') || 'dark';
  state.theme = savedTheme;
  elements.body.setAttribute('data-theme', savedTheme);
  
  // Update canvas pen default color based on theme
  if (savedTheme === 'light') {
    state.penColor = '#1e293b';
  } else {
    state.penColor = '#f8fafc';
    // Update active color indicator in UI
    const blackOpt = document.querySelector('.color-black');
    if (blackOpt) {
      blackOpt.style.background = '#f8fafc';
    }
  }
}

// Toggle Theme
function toggleTheme() {
  state.theme = state.theme === 'dark' ? 'light' : 'dark';
  elements.body.setAttribute('data-theme', state.theme);
  localStorage.setItem('socratic_theme', state.theme);
  
  const blackOpt = document.querySelector('.color-black');
  if (state.theme === 'light') {
    if (state.penColor === '#f8fafc') state.penColor = '#1e293b';
    if (blackOpt) blackOpt.style.background = '#1e293b';
  } else {
    if (state.penColor === '#1e293b') state.penColor = '#f8fafc';
    if (blackOpt) blackOpt.style.background = '#f8fafc';
  }
  
  showToast(`已切换至${state.theme === 'light' ? '日间' : '夜间'}模式`);
}

// Setup Event Listeners
function setupEventListeners() {
  elements.themeToggle.addEventListener('click', toggleTheme);
  elements.openConfigBtn.addEventListener('click', () => toggleModal(true));
  elements.closeConfigBtn.addEventListener('click', () => toggleModal(false));
  elements.cancelConfigBtn.addEventListener('click', () => toggleModal(false));
  elements.saveConfigBtn.addEventListener('click', saveConfig);
  
  elements.btnStartTutor.addEventListener('click', startSocraticTutor);
  elements.btnChatReset.addEventListener('click', resetChat);
  elements.btnChatSend.addEventListener('click', handleUserSendMessage);
  elements.btnRecordMic.addEventListener('click', toggleMicRecording);
  
  elements.selectTopic.addEventListener('change', handleTopicChange);
  
  elements.chatUserInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') handleUserSendMessage();
  });
  
  // Resize canvas when window changes
  window.addEventListener('resize', handleCanvasResize);
}

// Handle Topic Select Dropdown changes
function handleTopicChange() {
  if (elements.selectTopic.value === 'custom') {
    elements.customProblemContainer.style.display = 'block';
    handleCanvasResize(); // Refresh canvas since layout height adjusted
  } else {
    elements.customProblemContainer.style.display = 'none';
  }
}

// Populate Topics drop-down select based on Grade
function updateTopics() {
  const grade = elements.selectGrade.value;
  state.currentGrade = grade;
  
  const topics = gradeTopics[grade] || [];
  elements.selectTopic.innerHTML = '';
  
  topics.forEach(t => {
    const opt = document.createElement('option');
    opt.value = t.value;
    opt.textContent = t.label;
    elements.selectTopic.appendChild(opt);
  });
  
  // Always append custom problem type option
  const customOpt = document.createElement('option');
  customOpt.value = 'custom';
  customOpt.textContent = '✍️ 自定义数学题...';
  elements.selectTopic.appendChild(customOpt);
  
  handleTopicChange(); // Sync initial visibility
}


// Toggle Modal
function toggleModal(show) {
  if (show) {
    elements.configModal.classList.add('active');
  } else {
    elements.configModal.classList.remove('active');
  }
}

// Save Config
function saveConfig() {
  const base = elements.apiBaseInput.value.trim();
  const key = elements.apiKeyInput.value.trim();
  const model = elements.apiModelInput.value.trim();
  const whisperModel = elements.apiWhisperModelInput.value.trim() || 'whisper-1';
  
  localStorage.setItem('socratic_api_base', base);
  localStorage.setItem('socratic_api_key', key);
  localStorage.setItem('socratic_api_model', model);
  localStorage.setItem('socratic_api_whisper_model', whisperModel);
  
  state.apiConfig = { base, key, model, whisperModel };
  toggleModal(false);
  showToast('API 参数配置保存成功！');
}

// Show Toast
function showToast(message, isError = false) {
  elements.toast.textContent = message;
  elements.toast.style.background = isError ? '#ef4444' : '#1e293b';
  elements.toast.classList.add('show');
  setTimeout(() => {
    elements.toast.classList.remove('show');
  }, 3000);
}

// === Whiteboard Canvas Handlers ===
function initCanvas() {
  const canvas = elements.canvas;
  ctx = canvas.getContext('2d');
  
  // Set logical dimensions matching physical layout
  handleCanvasResize();
  
  // Drawing configurations
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  
  // Pen Drawing listeners
  canvas.addEventListener('mousedown', startDrawing);
  canvas.addEventListener('mousemove', draw);
  canvas.addEventListener('mouseup', stopDrawing);
  canvas.addEventListener('mouseout', stopDrawing);
  
  // Touch screens listeners
  canvas.addEventListener('touchstart', (e) => {
    e.preventDefault();
    const touch = e.touches[0];
    const mouseEvent = new MouseEvent('mousedown', {
      clientX: touch.clientX,
      clientY: touch.clientY
    });
    canvas.dispatchEvent(mouseEvent);
  });
  
  canvas.addEventListener('touchmove', (e) => {
    e.preventDefault();
    const touch = e.touches[0];
    const mouseEvent = new MouseEvent('mousemove', {
      clientX: touch.clientX,
      clientY: touch.clientY
    });
    canvas.dispatchEvent(mouseEvent);
  });
  
  canvas.addEventListener('touchend', (e) => {
    e.preventDefault();
    const mouseEvent = new MouseEvent('mouseup', {});
    canvas.dispatchEvent(mouseEvent);
  });
  
  elements.btnCanvasClear.addEventListener('click', clearCanvas);
  elements.btnCanvasUndo.addEventListener('click', undoCanvas);
  elements.btnCanvasExport.addEventListener('click', exportCanvasImage);
  
  // Save initial blank canvas state
  saveCanvasState();
}

function handleCanvasResize() {
  const canvas = elements.canvas;
  const rect = canvas.parentElement.getBoundingClientRect();
  
  // Save current canvas content
  let tempImage = null;
  try {
    tempImage = ctx.getImageData(0, 0, canvas.width, canvas.height);
  } catch(e) {}
  
  canvas.width = rect.width;
  canvas.height = rect.height;
  
  // Restore configs
  if (ctx) {
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    // Restore content
    if (tempImage) {
      ctx.putImageData(tempImage, 0, 0);
    }
  }
}

function startDrawing(e) {
  state.isDrawing = true;
  const canvas = elements.canvas;
  const rect = canvas.getBoundingClientRect();
  
  state.lastX = e.clientX - rect.left;
  state.lastY = e.clientY - rect.top;
}

function draw(e) {
  if (!state.isDrawing) return;
  
  const canvas = elements.canvas;
  const rect = canvas.getBoundingClientRect();
  const currentX = e.clientX - rect.left;
  const currentY = e.clientY - rect.top;
  
  ctx.beginPath();
  ctx.moveTo(state.lastX, state.lastY);
  ctx.lineTo(currentX, currentY);
  ctx.strokeStyle = state.penColor;
  ctx.lineWidth = state.brushSize;
  ctx.stroke();
  
  state.lastX = currentX;
  state.lastY = currentY;
}

function stopDrawing() {
  if (state.isDrawing) {
    state.isDrawing = false;
    saveCanvasState();
  }
}

// Canvas Undo / History States
function saveCanvasState() {
  try {
    const canvas = elements.canvas;
    const stateData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    state.canvasHistory.push(stateData);
    // Cap history length at 30
    if (state.canvasHistory.length > 30) {
      state.canvasHistory.shift();
    }
  } catch (e) {}
}

function undoCanvas() {
  if (state.canvasHistory.length > 1) {
    state.canvasHistory.pop(); // Remove current state
    const previousState = state.canvasHistory[state.canvasHistory.length - 1];
    ctx.putImageData(previousState, 0, 0);
    showToast('撤销一步');
  } else {
    showToast('已经是最初状态了！');
  }
}

function clearCanvas() {
  const canvas = elements.canvas;
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  state.canvasHistory = [];
  saveCanvasState();
  showToast('画板已清空');
}

function exportCanvasImage() {
  const canvas = elements.canvas;
  const tempCanvas = document.createElement('canvas');
  tempCanvas.width = canvas.width;
  tempCanvas.height = canvas.height;
  const tempCtx = tempCanvas.getContext('2d');
  
  // Fill background based on current theme (dark: deep slate, light: slate white)
  tempCtx.fillStyle = state.theme === 'light' ? '#f8fafc' : '#0f172a';
  tempCtx.fillRect(0, 0, tempCanvas.width, tempCanvas.height);
  
  // Draw the current canvas content on top
  tempCtx.drawImage(canvas, 0, 0);
  
  // Download PNG image
  try {
    const dataURL = tempCanvas.toDataURL('image/png');
    const link = document.createElement('a');
    link.download = `苏格拉底数学画板_${state.currentTopic}_${new Date().getTime()}.png`;
    link.href = dataURL;
    link.click();
    showToast('画板图片已成功导出下载！');
  } catch (e) {
    console.error(e);
    showToast('导出画板图片失败，请检查浏览器权限。', true);
  }
}

// Draw Preset Shapes
function setPenColor(color, element) {
  state.penColor = color;
  // Update indicator active class
  document.querySelectorAll('.color-option').forEach(el => el.classList.remove('active'));
  element.classList.add('active');
}

function setBrushSize(size) {
  state.brushSize = parseInt(size) || 5;
}

function drawPreset(shape) {
  const canvas = elements.canvas;
  const cx = canvas.width / 2;
  const cy = canvas.height / 2;
  
  ctx.strokeStyle = state.penColor;
  ctx.lineWidth = 3;
  ctx.fillStyle = 'transparent';
  
  if (shape === 'circle') {
    // Draw Circle in center
    ctx.beginPath();
    ctx.arc(cx, cy, 70, 0, 2 * Math.PI);
    ctx.stroke();
    
    // Draw dashed radius
    ctx.beginPath();
    ctx.setLineDash([5, 5]);
    ctx.moveTo(cx, cy);
    ctx.lineTo(cx + 70, cy);
    ctx.stroke();
    ctx.setLineDash([]); // Reset
    
    // Draw radius label
    ctx.font = '14px Outfit';
    ctx.fillStyle = state.theme === 'light' ? '#1e293b' : '#f8fafc';
    ctx.fillText("半径 r", cx + 25, cy - 10);
    showToast('画板生成：圆 (带半径标注)');
  } 
  else if (shape === 'rectangle') {
    // Draw rectangle
    ctx.beginPath();
    ctx.rect(cx - 90, cy - 60, 180, 120);
    ctx.stroke();
    
    // Add Labels
    ctx.font = '14px Outfit';
    ctx.fillStyle = state.theme === 'light' ? '#1e293b' : '#f8fafc';
    ctx.fillText("长 a", cx - 15, cy + 80);
    ctx.fillText("宽 b", cx + 105, cy + 5);
    showToast('画板生成：矩形 (长a, 宽b)');
  } 
  else if (shape === 'cylinder') {
    // Cylinder
    const rx = 80;
    const ry = 25;
    const h = 130;
    const topY = cy - h/2;
    const bottomY = cy + h/2;
    
    // Top Oval
    ctx.beginPath();
    ctx.ellipse(cx, topY, rx, ry, 0, 0, 2 * Math.PI);
    ctx.stroke();
    
    // Bottom Oval (Solid front, dashed back)
    ctx.beginPath();
    ctx.ellipse(cx, bottomY, rx, ry, 0, 0, Math.PI); // Front half
    ctx.stroke();
    
    ctx.beginPath();
    ctx.setLineDash([5, 5]);
    ctx.ellipse(cx, bottomY, rx, ry, 0, Math.PI, 2 * Math.PI); // Back half
    ctx.stroke();
    
    // Side Vertical Lines
    ctx.beginPath();
    ctx.setLineDash([]);
    ctx.moveTo(cx - rx, topY);
    ctx.lineTo(cx - rx, bottomY);
    ctx.moveTo(cx + rx, topY);
    ctx.lineTo(cx + rx, bottomY);
    ctx.stroke();
    
    // Label Height
    ctx.beginPath();
    ctx.setLineDash([3, 3]);
    ctx.moveTo(cx, topY);
    ctx.lineTo(cx, bottomY);
    ctx.stroke();
    ctx.setLineDash([]);
    
    ctx.font = '13px Outfit';
    ctx.fillStyle = state.theme === 'light' ? '#1e293b' : '#f8fafc';
    ctx.fillText("高 h", cx + 8, cy);
    ctx.fillText("半径 r", cx + rx/2, bottomY - ry - 4);
    
    showToast('画板生成：3D圆柱体');
  } 
  else if (shape === 'grid') {
    // Coordinate Grid (for Grade 5 positions)
    const gridSize = 25;
    const pad = 40;
    
    ctx.strokeStyle = 'rgba(99, 102, 241, 0.2)';
    ctx.lineWidth = 1;
    
    // Draw minor grid lines
    for (let x = pad; x < canvas.width - pad; x += gridSize) {
      ctx.beginPath();
      ctx.moveTo(x, pad);
      ctx.lineTo(x, canvas.height - pad);
      ctx.stroke();
    }
    for (let y = pad; y < canvas.height - pad; y += gridSize) {
      ctx.beginPath();
      ctx.moveTo(pad, y);
      ctx.lineTo(canvas.width - pad, y);
      ctx.stroke();
    }
    
    // Draw main axes
    ctx.strokeStyle = state.penColor;
    ctx.lineWidth = 2.5;
    
    // X Axis
    ctx.beginPath();
    ctx.moveTo(pad, canvas.height - pad);
    ctx.lineTo(canvas.width - pad + 10, canvas.height - pad);
    // Y Axis
    ctx.moveTo(pad, canvas.height - pad);
    ctx.lineTo(pad, pad - 10);
    ctx.stroke();
    
    // Draw arrows
    ctx.fillStyle = state.penColor;
    // Y Arrow
    ctx.beginPath();
    ctx.moveTo(pad, pad - 12);
    ctx.lineTo(pad - 5, pad);
    ctx.lineTo(pad + 5, pad);
    ctx.fill();
// X Arrow
    ctx.beginPath();
    ctx.moveTo(canvas.width - pad + 12, canvas.height - pad);
    ctx.lineTo(canvas.width - pad, canvas.height - pad - 5);
    ctx.lineTo(canvas.width - pad, canvas.height - pad + 5);
    ctx.fill();
    
    ctx.font = '12px Outfit';
    ctx.fillText("X 轴 (列)", canvas.width - pad - 40, canvas.height - pad + 20);
    ctx.fillText("Y 轴 (行)", pad - 35, pad + 10);
    ctx.fillText("O", pad - 15, canvas.height - pad + 15);
    
    showToast('画板生成：直角坐标格');
  }
  
  saveCanvasState();
}

// === Socratic Dialogue Management ===

// Start Socratic Tutor session
function startSocraticTutor() {
  const grade = elements.selectGrade.value;
  const topic = elements.selectTopic.value;
  const topicLabel = elements.selectTopic.options[elements.selectTopic.selectedIndex].text;
  
  let finalTopic = topic;
  let finalTopicLabel = topicLabel;
  let customText = '';
  
  const { key } = state.apiConfig;

  // Retrieve and validate custom problem
  if (topic === 'custom') {
    customText = elements.customProblemText.value.trim();
    if (!customText) {
      showToast('请输入您的自定义数学题目内容！', true);
      return;
    }
    finalTopicLabel = '自定义题目';
    
    // Offline keyword routing
    if (!key) {
      if (customText.includes('鸡') || customText.includes('兔')) {
        finalTopic = 'chicken-rabbit';
        showToast('离线演示已为您匹配：鸡兔同笼题型');
      } else if (customText.includes('圆柱') || customText.includes('圆锥') || customText.includes('表面积') || customText.includes('体积')) {
        finalTopic = 'cylinder-volume';
        showToast('离线演示已为您匹配：圆柱切拼题型');
      } else if (customText.includes('相遇') || customText.includes('路程') || customText.includes('速度') || customText.includes('相向')) {
        finalTopic = 'meet-problems';
        showToast('离线演示已为您匹配：路程相遇题型');
      } else {
        finalTopic = 'general';
        showToast('离线演示已为您匹配：通用代数题型');
      }
      state.currentTopic = finalTopic;
    }
  }
  
  state.currentGrade = grade;
  state.currentTopic = finalTopic;
  state.socraticChatHistory = [];
  state.socraticRound = 0;
  
  // Enable text input and send button
  elements.chatUserInput.disabled = false;
  elements.chatUserInput.value = '';
  elements.btnChatSend.disabled = false;
  
  elements.tutorStatus.innerHTML = `正在辅导：${grade}年级 • <b style="color: var(--primary-color);">${finalTopicLabel}</b>`;
  
  setChatLoading(true, '苏格拉底老师正在根据您的题目准备启发问题...');

  // Set initial drawings on Whiteboard Canvas
  setTimeout(() => {
    if (state.currentTopic === 'chicken-rabbit') {
      drawAIChickenRabbit(0);
    } else if (state.currentTopic === 'cylinder-volume') {
      drawAICylinderSplit(0);
    } else if (state.currentTopic === 'meet-problems') {
      drawAIMeetProblem(0);
    } else {
      drawGeneralEquationShape();
    }
  }, 100);

  setTimeout(async () => {
    let initialGreeting = '';

    // A. Offline Simulation Engine (Mock)
    if (!key) {
      if (state.currentTopic === 'chicken-rabbit') {
        initialGreeting = `你好！今天我们来研究‘鸡兔同笼’。有鸡和兔共 8 只，共有腿 22 条，问鸡和兔各有多少只？&#10;&#10;如果咱们假设这 8 只动物全是鸡，你觉得一共有多少条腿呢？`;
      } else if (state.currentTopic === 'cylinder-volume') {
        initialGreeting = `你好！今天我们来讨论‘圆柱切拼’。把一个底面半径 3 分米、高 10 分米的圆柱切开拼成一个近似的长方体。&#10;&#10;在切拼的过程中，圆柱的底面周长和长方体的“长、宽、高”有什么对应关系呢？`;
      } else if (state.currentTopic === 'meet-problems') {
        initialGreeting = `你好！今天我们来探讨‘相遇问题’。小明和小刚两家相距 450 米，小明每分钟走 60 米，小刚每分钟走 90 米，两人同时从两地相对出发。&#10;&#10;想一想，他们每走一分钟，彼此之间的距离会缩短多少米？为什么？`;
      } else if (state.currentTopic === 'polygon-areas') {
        initialGreeting = `你好！今天我们来讨论‘组合多边形面积转化’。怎么把一个不规则的多边形拆分或拼接成我们熟悉的三角形、长方形来计算面积呢？我们可以说一个具体的图形吗？`;
      } else if (state.currentTopic === 'simple-equations') {
        initialGreeting = `你好！今天我们来练习‘列方程解应用题’。列方程的关键是找到题目中的“等量关系”。假设：小红和小明一共有 80 张卡片，小明的卡片数是小红的 3 倍。&#10;&#10;如果设小红的卡片数为 $x$ 张，那小明的卡片数该怎么用 $x$ 来表示呢？`;
      } else if (state.currentTopic === 'work-problems') {
        initialGreeting = `你好！今天我们来研究‘工程问题’。有一项修路工程，甲队单独干需要 10 天完成，乙队单独干需要 15 天完成。&#10;&#10;在数学上，我们一般把这项工程的‘工作总量’看作什么？甲队和乙队一天分别能修多少工程呢？`;
      } else if (state.currentTopic === 'ratio-proportions') {
        initialGreeting = `你好！今天我们来探讨‘比与比例应用’。如果把 60 个苹果按 $2:3$ 分给大班和小班。&#10;&#10;这里的“$2:3$”代表什么意思？我们一共分成了多少份呢？`;
      } else if (state.currentTopic === 'percentage-change') {
        initialGreeting = `你好！今天我们来分析‘百分数增减变化’。如果一件商品先涨价 10%，再降价 10%。&#10;&#10;价格和原来相比是变高了、变低了，还是没有变呢？为什么？`;
      } else {
        initialGreeting = `你好！我是你的苏格拉底数学启发教练。对于今天讨论的【${topicLabel}】这一节，你现在遇到了什么具体问题，或者有什么疑惑的算式吗？你可以写在聊天框里，我们一步步来推导！`;
      }
      
      state.socraticChatHistory.push({ role: 'assistant', content: initialGreeting });
      renderChatBubbles();
      setChatLoading(false);
      populateQuickPills();
      showToast('苏格拉底智能体（离线模式）已成功开启！');
      return;
    }

    // B. Online Generation of First Socratic Question
    try {
      const systemPrompt = `你是一个辅导小学五六年级学生的【苏格拉底启发式数学辅导教练】。
当前讨论的主题是：【${state.currentGrade}年级：${topicLabel}】。

你的教学原则是：
1. 【决不直接给出答案】或列出最终式子，只引导学生自己推理。
2. 以极度亲切、鼓励的语气（小学生视角），使用生动的比喻，每次只问【一个问题】。
3. 严格保持简短（不超过80字），适合在手机/网页聊天气泡中阅读。
4. 数学表达式必须使用 LaTeX 格式（如 $x+3=8$ 或 $\\frac{1}{2}$）。
5. 现在是第一轮会话，请针对该数学主题，抛出一个最经典、最简单、最基础的概念性提问，作为对话的开始。若适用，可在结尾加画图指令，如 [draw: shape(circle)] 等。`;

      const userPrompt = `老师，我已经准备好了，请开始提问，指导我关于“${topicLabel}”的主题吧！`;

      const { base, key: apiKey, model } = state.apiConfig;
      const url = base.endsWith('/') ? `${base}chat/completions` : `${base}/chat/completions`;

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`
        },
        body: JSON.stringify({
          model: model,
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userPrompt }
          ],
          temperature: 0.6
        })
      });

      if (!response.ok) throw new Error('API Request Failed');

      const data = await response.json();
      initialGreeting = data.choices[0].message.content.trim();
      
      state.socraticChatHistory.push({ role: 'assistant', content: initialGreeting });
      renderChatBubbles();
      showToast('苏格拉底智能体（云端模型）已连接！');
    } catch (e) {
      console.error(e);
      const fallback = `你好！今天我们来讨论【${topicLabel}】。你认为关于这个主题，最核心的公式或基本规律是什么呢？`;
      state.socraticChatHistory.push({ role: 'assistant', content: fallback });
      renderChatBubbles();
      showToast('连接失败，使用本地备选问题启动。', true);
    } finally {
      setChatLoading(false);
      populateQuickPills();
    }
  }, 1000);
}

// Generate Quick Pills dynamically based on Topic and Conversation Round
function populateQuickPills() {
  const pillsContainer = elements.quickPills;
  pillsContainer.innerHTML = '';
  
  let pills = [];
  const topic = state.currentTopic;
  const round = state.socraticRound;
  
  if (topic === 'chicken-rabbit') {
    if (round === 0) {
      pills = ['鸡有2只脚，所以一共有 $8 \\times 2 = 16$ 只脚', '如果全是兔子呢？', '我不知道怎么算脚的数量'];
    } else if (round === 1) {
      pills = ['因为把兔子当成了鸡，脚少算了 $22 - 16 = 6$ 只', '我不明白脚为什么变少'];
    } else if (round === 2) {
      pills = ['兔子比鸡多 2 只脚，要把少算的6只脚补回去，所以兔子有 $6 \\div 2 = 3$ 只！', '用 $6 \\div 2$ 就能算出来兔子吗？'];
    } else {
      pills = ['鸡有 $8 - 3 = 5$ 只！', '我们能列式验证一下吗？', '我全懂了，谢谢老师！'];
    }
  } else if (topic === 'cylinder-volume') {
    if (round === 0) {
      pills = ['长方体的高是圆柱的高 $h$，宽是底半径 $r$，长是底面周长的一半 $\\pi r$', '我记不清它们的对应关系了'];
    } else if (round === 1) {
      pills = ['体积是一样的！表面积变大了，多出两个切面！', '体积发生了改变吗？'];
    } else if (round === 2) {
      pills = ['切面是矩形，长是高10，宽是半径3。多出来的面积是 $2 \\times 3 \\times 10 = 60$ 平方分米', '怎么算多出两个面的面积？'];
    } else {
      pills = ['增加表面积的公式是 $2 \\times r \\times h$ ！', '我学会怎么推导了，很有用！'];
    }
  } else if (topic === 'meet-problems') {
    if (round === 0) {
      pills = ['一分钟会缩短 $60 + 90 = 150$ 米，因为是在向对方走近', '每分钟缩短路程就是速度相加'];
    } else if (round === 1) {
      pills = ['所以相遇时间是路程除以他们的速度和，也就是 $450 \\div 150 = 3$ 分钟', '我可以用公式验算吗？'];
    } else {
      pills = ['追及问题缩短的距离就是速度之差！', '我明白了，相遇相向用和，追及同向用差！'];
    }
  } else if (topic === 'work-problems') {
    if (round === 0) {
      pills = ['把工作总量看作整个 1', '甲每天能干 $\\frac{1}{10}$，乙每天能干 $\\frac{1}{15}$', '我不确定总量该设多少'];
    } else if (round === 1) {
      pills = ['合作一天的效率是 $\\frac{1}{10} + \\frac{1}{15} = \\frac{1}{6}$', '把两个人的效率相加就是合作效率'];
    } else if (round === 2) {
      pills = ['用总量 1 除以合作效率 $\\frac{1}{6}$，得到 6 天！', '需要用 $1 \\div \\frac{1}{6}$ 来计算吗？'];
    } else {
      pills = ['原来效率和时间是互为倒数的关系！', '我明白了，合作效率高，时间就短！'];
    }
  } else if (topic === 'simple-equations') {
    if (round === 0) {
      pills = ['设小红的卡片数为 $x$，那小明就是 $3x$', '可以用未知数 $x$ 表示小明的数量吗？'];
    } else if (round === 1) {
      pills = ['列出的方程是 $x + 3x = 80$', '小红的加小明的等于总数 80 张'];
    } else if (round === 2) {
      pills = ['方程整理得 $4x = 80$，所以 $x = 20$，是小红的卡片数！', '怎么求出 $x$ 的值呢？'];
    } else {
      pills = ['小明的卡片数是 $3 \\times 20 = 60$ 张！', '用 $20 + 60 = 80$ 刚好符合题目要求！'];
    }
  } else if (topic === 'polygon-areas') {
    if (round === 0) {
      pills = ['长方形的长对应平行四边形的底，宽对应平行四边形的高，面积不变', '底和高与长方形的长宽是一样的'];
    } else if (round === 1) {
      pills = ['平行四边形面积公式是底 $\\times$ 高，所以面积是 $8 \\times 5 = 40$ 平方厘米', '面积是 40 平方厘米'];
    } else {
      pills = ['可以用分割法或添补法来求组合多边形面积！', '我学到了把复杂图形转化为简单图形的办法！'];
    }
  } else if (topic === 'ratio-proportions') {
    if (round === 0) {
      pills = ['一共分成了 $2 + 3 = 5$ 份，一班占 2 份，二班占 3 份', '代表两班分得的苹果份数之比'];
    } else if (round === 1) {
      pills = ['一份是 12 个，大班 24 个，小班 36 个', '用 $60 \\div 5$ 算出每份是 12 个'];
    } else {
      pills = ['相加等于 60，比值是 $2:3$，正好符合！', '按比例分配就是算出每份的量再乘以对应份数！'];
    }
  } else if (topic === 'percentage-change') {
    if (round === 0) {
      pills = ['原价 100 元，涨价 10% 后是 110 元', '可以用 $100 \\times (1 + 10\\%)$ 算出涨价后的价格'];
    } else if (round === 1) {
      pills = ['降价了 11 元，最后价格是 99 元', '在 110 元基础上降价 10% 就是 $110 \\times (1 - 10\\%)$'];
    } else if (round === 2) {
      pills = ['因为第二次降价的基数（单位一）变成了 110 元，所以降得更多！', '基数变大，导致降价额度比涨价额度要大！'];
    } else {
      pills = ['百分数增减不能简单把加减百分比抵消！', '谢谢老师，我知道怎么找单位一了！'];
    }
  } else {
    // Default Pills
    pills = ['我想从这个思路试一下', '老师，我不确定我的想法对不对', '请问下一步我该怎么想？'];
  }
  
  pills.forEach(text => {
    const pillBtn = document.createElement('button');
    pillBtn.className = 'pill';
    pillBtn.innerHTML = renderMath(text);
    pillBtn.onclick = () => {
      elements.chatUserInput.value = text;
      handleUserSendMessage();
    };
    pillsContainer.appendChild(pillBtn);
  });
}

// User Send Message Handler
async function handleUserSendMessage() {
  const text = elements.chatUserInput.value.trim();
  if (!text) return;
  
  elements.chatUserInput.value = '';
  
  // Append student bubble
  state.socraticChatHistory.push({ role: 'user', content: text });
  renderChatBubbles();
  
  state.socraticRound++;
  
  const { key } = state.apiConfig;
  
  // 1. Offline simulation Mode (Mock responses)
  if (!key) {
    setChatLoading(true, '苏格拉底老师正在倾听思考中...');
    setTimeout(() => {
      runOfflineSimulation(text);
      setChatLoading(false);
      populateQuickPills();
    }, 1000);
    return;
  }
  
  // 2. Online API Socratic Chat loop
  setChatLoading(true, '苏格拉底老师正在深度思考中...');
  try {
    const topicLabel = elements.selectTopic.options[elements.selectTopic.selectedIndex].text;
    
    const systemPrompt = `你是一个专门辅导小学五六年级学生的【苏格拉底启发式数学辅导教练】。
当前讨论的主题是：【${state.currentGrade}年级：${topicLabel}】。

你的核心教学原则是：
1. 【绝对不能直接给出答案】或列出完整算式，只引导学生自己推理。
2. 每次只问【一个开放式问题】，语言保持极其简短（限制在 80 字以内），语气亲切鼓励。
3. 数学公式必须使用标准 LaTeX 格式包裹（如 $x+3x=80$ 或 $\\frac{1}{2}$）。
4. 适时附带特定作图标签指导前端绘图，例如 [draw: chicken_rabbit(0)]（假设全是鸡）、[draw: chicken_rabbit(1)]（升级兔子）、[draw: meet(0)]或[draw: meet(1)]（相遇动画）、[draw: cylinder(0)]或[draw: cylinder(1)]（圆柱切拼）、[draw: shape(circle)]（圆）、[draw: shape(rectangle)]（矩形）、[draw: shape(grid)]（坐标系）。
5. 对话历史已在 messages 中。若回答对则肯定并推进下一阶梯问题；若答错不要直接否定，通过追问引导自己发现矛盾。`;

    const requestMessages = [
      { role: 'system', content: systemPrompt },
      ...state.socraticChatHistory
    ];
    
    const { base, key: apiKey, model } = state.apiConfig;
    const url = base.endsWith('/') ? `${base}chat/completions` : `${base}/chat/completions`;
    
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: model,
        messages: requestMessages,
        temperature: 0.5
      })
    });
    
    if (!response.ok) throw new Error('API Generate Error');
    
    const data = await response.json();
    const reply = data.choices[0].message.content.trim();
    
    // Parse and execute draw command, clean up text
    const cleanReply = executeAIDrawingInstruction(reply);
    
    state.socraticChatHistory.push({ role: 'assistant', content: cleanReply });
    renderChatBubbles();
  } catch (error) {
    console.error(error);
    const errReply = `你的想法很有趣！那我们不妨在画板上画一下这几个量，看看它们组合在一起能产生什么新变化呢？`;
    state.socraticChatHistory.push({ role: 'assistant', content: errReply });
    renderChatBubbles();
  } finally {
    setChatLoading(false);
    populateQuickPills();
  }
}


// HTML escaping utility to prevent XSS
function escapeHTML(str) {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

// Math typesetting using KaTeX
function renderMath(text) {
  if (typeof katex === 'undefined') {
    return escapeHTML(text);
  }
  
  const segments = [];
  let lastIndex = 0;
  
  // Match inline math $...$ and block math $$...$$
  const regex = /\$\$(.*?)\$\$|\$(.*?)\$/g;
  let match;
  
  while ((match = regex.exec(text)) !== null) {
    // Add text segment before math block (escaped)
    if (match.index > lastIndex) {
      segments.push(escapeHTML(text.substring(lastIndex, match.index)));
    }
    
    const displayMath = match[1];
    const inlineMath = match[2];
    const formula = displayMath || inlineMath;
    const isDisplay = !!displayMath;
    
    try {
      // Decode typical HTML entities inside math block that could arise from editor/system
      const decodedFormula = formula
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/&amp;/g, '&');
      
      const html = katex.renderToString(decodedFormula, {
        displayMode: isDisplay,
        throwOnError: false
      });
      segments.push(html);
    } catch (e) {
      segments.push(escapeHTML(match[0]));
    }
    
    lastIndex = regex.lastIndex;
  }
  
  if (lastIndex < text.length) {
    segments.push(escapeHTML(text.substring(lastIndex)));
  }
  
  // Re-encode newlines in non-math segments back to <br> for display
  return segments.join('').replace(/\n/g, '<br>');
}

// Render Chat Bubbles
function renderChatBubbles() {
  const historyContainer = elements.chatHistory;
  historyContainer.innerHTML = '';
  
  state.socraticChatHistory.forEach(msg => {
    const isAI = msg.role === 'assistant';
    const bubble = document.createElement('div');
    bubble.className = `bubble ${isAI ? 'bubble-ai' : 'bubble-student'}`;
    
    const avatar = document.createElement('div');
    avatar.className = `avatar ${isAI ? 'avatar-ai' : 'avatar-student'}`;
    avatar.textContent = isAI ? '∑' : 'S';
    
    const content = document.createElement('div');
    content.className = 'bubble-content';
    
    const sender = document.createElement('div');
    sender.className = 'bubble-sender';
    sender.textContent = isAI ? '苏格拉底数学教练' : '学生';
    
    const textEl = document.createElement('div');
    textEl.className = 'bubble-text';
    textEl.innerHTML = renderMath(msg.content);
    
    content.appendChild(sender);
    content.appendChild(textEl);
    
    bubble.appendChild(avatar);
    bubble.appendChild(content);
    
    historyContainer.appendChild(bubble);
  });
  
  // Scroll to bottom
  historyContainer.scrollTop = historyContainer.scrollHeight;
}

// Offline multi-turn dialogue simulation database
function runOfflineSimulation(userText) {
  const topic = state.currentTopic;
  const round = state.socraticRound;
  let reply = '';
  
  if (topic === 'chicken-rabbit') {
    if (round === 1) {
      reply = `算得非常对！全是鸡确实会有 16 只脚。可是题目里说一共有 22 只脚。为什么我们算出来的脚比实际少了呢？少了多少只脚呢？`;
      drawAIChickenRabbit(0);
    } else if (round === 2) {
      reply = `你太聪明了！因为我们把兔子当成了鸡，所以脚少算了 6 只（$22 - 16 = 6$）。那你想想，一只兔子实际上比一只鸡多几只脚？我们要怎么把少算的这 6 只脚补回兔子身上呢？`;
      drawAIChickenRabbit(1, 8, 3);
    } else if (round === 3) {
      reply = `太厉害了！$6 \\div 2 = 3$，多出 3 只兔子！那既然 8 只头里有 3 只是兔子，鸡应该有几只呢？我已在左侧为你标红补齐了腿，请看图。`;
      drawAIChickenRabbit(1, 8, 3);
    } else if (round === 4) {
      reply = `完全正确！3 只兔子和 5 只鸡，一共有 $5 \\times 2 + 3 \\times 4 = 22$ 只脚，头也是 8 个。完美吻合！你通过假设法自己解决了鸡兔同笼。你可以试着用一句话总结，什么是假设法吗？`;
      drawAIChickenRabbit(1, 8, 3);
    } else {
      reply = `不客气！假设法就是先设全是一种，然后算出差额，再通过脚的差去多退少补。你已经掌握了它的精髓！加油！`;
      drawAIChickenRabbit(1, 8, 3);
    }
  } 
  else if (topic === 'cylinder-volume') {
    if (round === 1) {
      reply = `描述得非常精准！长方体的宽是 $r$，高是 $h$，长是底面周长的一半 $\\pi r$。那拼好之后，长方体的体积和圆柱相比发生改变了吗？多出来的表面积是多出来的哪几个面呢？`;
      drawAICylinderSplit(1);
    } else if (round === 2) {
      reply = `真棒！体积确实没有任何改变。多出了左右两个长方形切面。那你能根据圆柱的已知底半径 3 分米和高 10 分米，求出这两个多出来的切面的面积之和是多少平方分米吗？`;
      drawAICylinderSplit(1);
    } else if (round === 3) {
      reply = `太厉害了！完全算对了！增加了两个长为高 10、宽为半径 3 的长方形，表面积增加了 60 平方分米（$2 \\times 3 \\times 10 = 60$），而体积保持不变。你能试着在画板上把表面积增加的“捷径公式”写出来吗？`;
      drawAICylinderSplit(1);
    } else if (round === 4) {
      reply = `精辟！你总结出了最简捷的表面积增加公式 $2rh$。为你出色的总结能力和几何图形空间感知点赞！继续保持这样的好势头！`;
      drawAICylinderSplit(1);
    } else {
      reply = `不客气！圆柱拼切长方体，体积恒定不动，表面积唯独多出两个底面半径乘高的长方形（即 $2rh$）。你已经学通了这一关！`;
      drawAICylinderSplit(1);
    }
  } 
  else if (topic === 'meet-problems') {
    if (round === 1) {
      reply = `分析非常合理！因为是相向靠近，一分钟走近的路程就是两人的速度和（$60 + 90 = 150$ 米）。那么为了求出他们多长时间能正好把相距的 450 米完全“走完”相遇，我们该怎么列算式呢？请看左侧，他们开始运动了！`;
      drawAIMeetProblem(1);
    } else if (round === 2) {
      reply = `非常完美！$450 \\div 150 = 3$ 分钟。如果老师把题目改一下：“小刚和小明往同一个方向走，小刚在后面追小明”，这时一分钟内他们之间的距离会缩短多少呢？该怎么算呢？`;
    } else {
      reply = `太棒了！同向追及就要使用速度差，相向靠近则用速度和。这就是相遇与追及问题的本质区别。你已经完全做到了融会贯通，祝贺你！`;
    }
  } 
  else if (topic === 'work-problems') {
    if (round === 1) {
      reply = `太棒了！我们把总量看作 1。那甲单独做需要 10 天，每天做 $\\frac{1}{10}$；乙需要 15 天，每天做 $\\frac{1}{15}$。如果他们合作，一天合起来能修这项工程的几分之几呢？`;
    } else if (round === 2) {
      reply = `完全正确！$\\frac{1}{10} + \\frac{1}{15} = \\frac{1}{6}$。每天合作能修工程的 $\\frac{1}{6}$。那干完这整个“1”的工程，他们合作需要多少天？怎么列式？`;
    } else if (round === 3) {
      reply = `真聪明！$1 \\div \\frac{1}{6} = 6$ 天。这就是“合作时间 = 工作总量 $\\div$ 效率之和”。你能解释一下，为什么效率之和越大，需要的时间就越短吗？`;
    } else {
      reply = `非常正确！效率和时间是反比例关系，效率越高做工越快，时间自然缩短。你已经完美通关工程问题！`;
    }
  } 
  else if (topic === 'simple-equations') {
    if (round === 1) {
      reply = `非常准确！小红为 $x$，因为小明是小红的 3 倍，所以小明为 $3x$。那小明和小红“一共有 80 张卡片”这个等量关系，怎么用含有 $x$ 的等式（方程）表示出来呢？`;
    } else if (round === 2) {
      reply = `太赞了！合并同类项得到 $4x = 80$。那请你求一下，这个方程的解 $x$ 等于多少？它代表谁的卡片数？`;
    } else if (round === 3) {
      reply = `算得完全正确！$x = 20$ 代表小红有 20 张。那么小明有几张卡片呢？咱们怎么带回原题验证答案的正确性？`;
    } else {
      reply = `真棒！小明有 $3 \\times 20 = 60$ 张。$20 + 60 = 80$ 符合题意！列方程的核心就是：设未知数 $\\rightarrow$ 找等量关系 $\\rightarrow$ 列方程求解。你已经掌握了！`;
    }
  } 
  else if (topic === 'polygon-areas') {
    if (round === 1) {
      reply = `完全正确！沿着平行四边形的高切开并移到另一侧，拼成的长方形的“长”等于“底”，“宽”等于“高”，面积没有任何改变。那平行四边形的面积计算公式是什么？它的面积是多少？`;
    } else if (round === 2) {
      reply = `太厉害了！平行四边形面积 = 底 $\\times$ 高 = $8 \\times 5 = 40$ 平方厘米。如果要把一个不规则的“L型”组合多边形求面积，你通常会采用什么办法来求呢？`;
    } else {
      reply = `没错，可以用“分割法”拆成两个长方形，或者用“添补法”补成大长方形减去空白。通过转化，复杂图形就会变简单！`;
    }
  } 
  else if (topic === 'ratio-proportions') {
    if (round === 1) {
      reply = `说得真棒！$2:3$ 意味着把 60 个苹果一共分成了 $2+3=5$ 等份，大班分得 2 份，小班分得 3 份。那么，请问每一份是多少个苹果呢？大班和小班各分得多少个呢？`;
    } else if (round === 2) {
      reply = `算得太准了！每一份是 $60 \\div 5 = 12$ 个。大班分 $12 \\times 2 = 24$ 个，小班分 $12 \\times 3 = 36$ 个。咱们分完之后，该怎么检验这两个结果的比例和总量是否符合题目要求？`;
    } else {
      reply = `完全正确！总量 $24+36=60$ 个，比值 $24:36 = 2:3$。通过按比例分配，我们完美解决了分苹果的问题，真棒！`;
    }
  } 
  else if (topic === 'percentage-change') {
    if (round === 1) {
      reply = `完全正确！原价 100 元，涨价 10% 后是 $100 \\times (1 + 10\\%) = 110$ 元。那么，在此基础上再降价 10%，降了多少钱？降价后的最终价格是多少？`;
    } else if (round === 2) {
      reply = `太聪明了！在 110 元的基础上降价 10%，实际降了 $110 \\times 10\\% = 11$ 元，最终降到 $110 - 11 = 99$ 元。那你想想，为什么涨 10% 再降 10%，最终却少钱了呢？`;
    } else if (round === 3) {
      reply = `精辟！因为两次计算百分数的“基数（单位一）”变了。涨价时是以 100 元为基数，降价时是以更高的 110 元为基数。这就是百分数变化的秘密。你明白了吗？`;
    } else {
      reply = `不客气！做百分数应用题时，一定要先看清“单位1”是谁。基数不同，相同百分数代表的实际数值就截然不同。你已经彻底学懂啦！`;
    }
  } 
  else {
    if (round === 1) {
      reply = `很好的切入点！那围绕这一步，你输入的这道自定义题中，有哪些核心的数据或公式是我们可以直接列出的呢？`;
      drawGeneralEquationShape();
    } else if (round === 2) {
      reply = `你说的很对。那么现在把这些条件通过刚才的公式套用进去，算一算，最终结果会是多少？我们可以怎么去检验答案？`;
      drawGeneralEquationShape();
    } else {
      reply = `分析得非常有条理。今天的苏格拉底追问就到这里，你已经成功证明了自己的推理过程。下次继续保持！`;
    }
  }
  
  state.socraticChatHistory.push({ role: 'assistant', content: reply });
  renderChatBubbles();
}


// Reset Chat History
function resetChat() {
  state.socraticChatHistory = [];
  state.socraticRound = 0;
  elements.chatHistory.innerHTML = `
    <div class="bubble bubble-ai">
      <div class="avatar avatar-ai">∑</div>
      <div class="bubble-content">
        <div class="bubble-sender">苏格拉底数学教练</div>
        <div class="bubble-text">对话已重置。请在上方选择年级和你要讨论的主题，点击“开启启发辅导”，重新开始我们的数学对话吧！</div>
      </div>
    </div>
  `;
  elements.chatUserInput.disabled = true;
  elements.chatUserInput.value = '';
  elements.btnChatSend.disabled = true;
  elements.quickPills.innerHTML = '';
  elements.tutorStatus.textContent = '请在上方选择你要讨论的数学主题，然后点击“开启启发辅导”';
  showToast('对话已清空，请重新开启选题。');
}

// Set Chat Loading State
function setChatLoading(loading, text = '') {
  state.isAnalyzing = loading;
  if (loading) {
    elements.chatLoading.style.display = 'flex';
    elements.chatLoadingText.innerHTML = text;
    elements.btnChatSend.disabled = true;
  } else {
    elements.chatLoading.style.display = 'none';
    elements.btnChatSend.disabled = false;
  }
}

// === Speech to Text dictation for Socratic replies ===
let chatRecognition = null;
function toggleMicRecording() {
  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (!SpeechRecognition) {
    showToast('您的浏览器不支持语音识别。请使用 Chrome 浏览器。', true);
    return;
  }

  if (state.isRecording) {
    if (chatRecognition) {
      chatRecognition.stop();
    }
  } else {
    chatRecognition = new SpeechRecognition();
    chatRecognition.continuous = false; // Stops automatically when student stops talking
    chatRecognition.interimResults = false;
    chatRecognition.lang = 'zh-CN';

    chatRecognition.onstart = () => {
      state.isRecording = true;
      elements.btnRecordMic.classList.add('recording');
      elements.btnRecordMic.textContent = '⏹';
      showToast('正在录音回答，请说话...');
    };

    chatRecognition.onresult = (event) => {
      const transcript = event.results[0][0].transcript;
      elements.chatUserInput.value = transcript;
    };

    chatRecognition.onerror = (event) => {
      console.error('Speech recognition error:', event.error);
      showToast(`语音录入失败: ${event.error}`, true);
      stopMicUI();
    };

    chatRecognition.onend = () => {
      stopMicUI();
      // Auto-send if something has been recognized
      if (elements.chatUserInput.value.trim()) {
        handleUserSendMessage();
      }
    };

    chatRecognition.start();
  }
}

function stopMicUI() {
  state.isRecording = false;
  elements.btnRecordMic.classList.remove('recording');
  elements.btnRecordMic.textContent = '🎤';
}

// === AI Guided Math Whiteboard Drawing Engine ===

// Parse and intercept AI [draw] instructions
function executeAIDrawingInstruction(text) {
  if (!text) return '';

  // Intercept all [draw: xxx] patterns
  const drawRegex = /\[draw:\s*([^\]]+)\]/g;
  let match;
  
  while ((match = drawRegex.exec(text)) !== null) {
    const cmd = match[1].trim();
    console.log("Executing AI Drawing Command:", cmd);
    
    try {
      if (cmd.startsWith('chicken_rabbit')) {
        // Parse chicken_rabbit(step)
        const argMatch = cmd.match(/chicken_rabbit\((\d+)\)/);
        if (argMatch) {
          const step = parseInt(argMatch[1]);
          drawAIChickenRabbit(step, 8, 3);
        }
      } else if (cmd.startsWith('cylinder')) {
        const argMatch = cmd.match(/cylinder\((\d+)\)/);
        if (argMatch) {
          const step = parseInt(argMatch[1]);
          drawAICylinderSplit(step);
        }
      } else if (cmd.startsWith('meet')) {
        const argMatch = cmd.match(/meet\((\d+)\)/);
        if (argMatch) {
          const step = parseInt(argMatch[1]);
          drawAIMeetProblem(step);
        }
      } else if (cmd.startsWith('shape')) {
        const argMatch = cmd.match(/shape\((\w+)\)/);
        if (argMatch) {
          const shapeType = argMatch[1];
          drawPreset(shapeType);
        }
      }
    } catch (e) {
      console.error("AI Drawing Execution Error:", e);
    }
  }

  // Remove the draw tags from user-facing text
  return text.replace(/\[draw:\s*[^\]]+\]/g, '').trim();
}

// 1. Chicken and Rabbit Drawing Model
function drawAIChickenRabbit(step, totalHeads = 8, rabbits = 3) {
  const canvas = elements.canvas;
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  
  const textColor = state.theme === 'light' ? '#1e293b' : '#f8fafc';
  const labelColor = '#6366f1';
  
  // Title
  ctx.font = 'bold 16px Noto Sans SC, sans-serif';
  ctx.fillStyle = textColor;
  ctx.fillText('鸡兔同笼：AI 假设法模型直观', 24, 34);
  
  // Draw Heads (circles)
  const cy = canvas.height / 2 - 30;
  const radius = 20;
  const gap = 55;
  const startX = (canvas.width - (gap * (totalHeads - 1))) / 2;
  
  ctx.lineWidth = 3;
  ctx.strokeStyle = state.theme === 'light' ? '#475569' : '#cbd5e1';
  
  for (let i = 0; i < totalHeads; i++) {
    const cx = startX + i * gap;
    
    // Draw Circle (Head)
    ctx.beginPath();
    ctx.arc(cx, cy, radius, 0, 2 * Math.PI);
    ctx.fillStyle = state.theme === 'light' ? '#f1f5f9' : '#1e1b4b';
    ctx.fill();
    ctx.stroke();
    
    // Head Index Number
    ctx.font = '12px Outfit';
    ctx.fillStyle = textColor;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText((i + 1).toString(), cx, cy);
    
    // Determine Legs for this head
    let legCount = 2; // Default chicken has 2 legs
    let isRabbitLeg = false;
    
    if (step === 1 && i >= (totalHeads - rabbits)) {
      legCount = 4; // Rabbit has 4 legs
      isRabbitLeg = true;
    }
    
    // Draw Legs
    // Left leg
    ctx.beginPath();
    ctx.strokeStyle = state.theme === 'light' ? '#1e293b' : '#cbd5e1';
    ctx.lineWidth = 3;
    ctx.moveTo(cx - 8, cy + radius);
    ctx.lineTo(cx - 15, cy + radius + 25);
    ctx.stroke();
    
    // Right leg
    ctx.beginPath();
    ctx.moveTo(cx + 8, cy + radius);
    ctx.lineTo(cx + 15, cy + radius + 25);
    ctx.stroke();
    
    // Rabbit extra legs (Highlighed red for step 1)
    if (legCount === 4) {
      ctx.beginPath();
      ctx.strokeStyle = '#ef4444'; // Red leg for new rabbit feet
      ctx.lineWidth = 3.5;
      
      // Far-left leg
      ctx.moveTo(cx - 14, cy + radius - 4);
      ctx.lineTo(cx - 25, cy + radius + 20);
      
      // Far-right leg
      ctx.moveTo(cx + 14, cy + radius - 4);
      ctx.lineTo(cx + 25, cy + radius + 20);
      ctx.stroke();
      
      // Rabbit Ears
      ctx.beginPath();
      ctx.strokeStyle = '#ef4444';
      ctx.moveTo(cx - 6, cy - radius);
      ctx.lineTo(cx - 10, cy - radius - 15);
      ctx.moveTo(cx + 6, cy - radius);
      ctx.lineTo(cx + 10, cy - radius - 15);
      ctx.stroke();
    } else {
      // Chicken beak/comb
      ctx.beginPath();
      ctx.fillStyle = '#f97316';
      ctx.moveTo(cx - 3, cy - radius);
      ctx.lineTo(cx, cy - radius - 6);
      ctx.lineTo(cx + 3, cy - radius);
      ctx.fill();
    }
  }
  
  // Footer Labels
  ctx.textAlign = 'left';
  ctx.textBaseline = 'alphabetic';
  ctx.font = '14px Noto Sans SC, sans-serif';
  
  if (step === 0) {
    ctx.fillStyle = labelColor;
    ctx.fillText('第一步：【假设全是鸡】', 24, canvas.height - 80);
    ctx.fillStyle = textColor;
    ctx.fillText('• 8只鸡一共有：8 × 2 = 16 只脚。', 24, canvas.height - 55);
    ctx.fillText('• 与实际 22 只脚相比，少了 22 - 16 = 6 只脚。', 24, canvas.height - 32);
  } else {
    ctx.fillStyle = '#ef4444';
    ctx.fillText('第二步：【多退少补 - 鸡升级成兔】', 24, canvas.height - 80);
    ctx.fillStyle = textColor;
    ctx.fillText('• 一只兔子比一只鸡多 2 只脚。少算的 6 只脚平分下去。', 24, canvas.height - 55);
    ctx.fillText('• 升级兔子数：6 ÷ 2 = 3 只兔。鸡数：8 - 3 = 5 只鸡。符合 22 只脚！', 24, canvas.height - 32);
  }
  
  saveCanvasState();
}

// 2. Cylinder Split & Morph Drawing Model
function drawAICylinderSplit(step) {
  const canvas = elements.canvas;
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  
  const textColor = state.theme === 'light' ? '#1e293b' : '#f8fafc';
  
  ctx.font = 'bold 16px Noto Sans SC, sans-serif';
  ctx.fillStyle = textColor;
  ctx.fillText('圆柱切拼长方体：表面积体积变化模型', 24, 34);
  
  const cx = canvas.width / 2;
  const cy = canvas.height / 2 - 20;
  
  if (step === 0) {
    // Standard Cylinder Labeling
    const rx = 65;
    const ry = 22;
    const h = 140;
    const topY = cy - h/2;
    const bottomY = cy + h/2;
    
    ctx.strokeStyle = state.theme === 'light' ? '#475569' : '#818cf8';
    ctx.lineWidth = 3;
    
    // Top oval
    ctx.beginPath();
    ctx.ellipse(cx, topY, rx, ry, 0, 0, 2 * Math.PI);
    ctx.stroke();
    
    // Bottom solid / dashed
    ctx.beginPath();
    ctx.ellipse(cx, bottomY, rx, ry, 0, 0, Math.PI);
    ctx.stroke();
    ctx.beginPath();
    ctx.setLineDash([5, 5]);
    ctx.ellipse(cx, bottomY, rx, ry, 0, Math.PI, 2 * Math.PI);
    ctx.stroke();
    ctx.setLineDash([]);
    
    // Verticals
    ctx.beginPath();
    ctx.moveTo(cx - rx, topY);
    ctx.lineTo(cx - rx, bottomY);
    ctx.moveTo(cx + rx, topY);
    ctx.lineTo(cx + rx, bottomY);
    ctx.stroke();
    
    // Dimension arrows
    ctx.strokeStyle = '#ef4444';
    ctx.beginPath();
    ctx.moveTo(cx, bottomY);
    ctx.lineTo(cx + rx, bottomY);
    ctx.stroke();
    
    // Height helper
    ctx.strokeStyle = '#10b981';
    ctx.beginPath();
    ctx.setLineDash([4, 4]);
    ctx.moveTo(cx - rx - 20, topY);
    ctx.lineTo(cx - rx - 20, bottomY);
    ctx.stroke();
    ctx.setLineDash([]);
    
    ctx.font = '13px Outfit, Noto Sans SC';
    ctx.fillStyle = textColor;
    ctx.fillText("半径 r = 3 dm", cx + rx/2 - 10, bottomY - ry - 4);
    ctx.fillText("高 h = 10 dm", cx - rx - 100, cy);
    
    ctx.font = '14px Noto Sans SC, sans-serif';
    ctx.fillStyle = '#818cf8';
    ctx.fillText("圆柱特征：底面半径 r = 3，高 h = 10。拼切时长方体由圆柱拼接而成。", 24, canvas.height - 45);
  } else {
    // Split Morphed Prism comparison
    // Draw prism with exposed side rectangles highlighted in transparent color
    const px = cx - 140;
    const py = cy - 50;
    const pw = 120; // Length = pi * r
    const pd = 60;  // Width = r
    const ph = 110; // Height = h
    
    // Draw Rectangular Prism Wireframe
    ctx.strokeStyle = state.theme === 'light' ? '#334155' : '#94a3b8';
    ctx.lineWidth = 2;
    
    // Highlight Left Cutting Face (exposed face)
    ctx.fillStyle = 'rgba(139, 92, 246, 0.25)'; // Purple semi-transparent
    ctx.beginPath();
    ctx.rect(px, py, pd, ph);
    ctx.fill();
    ctx.stroke();
    
    // Highlight Right Cutting Face (exposed face)
    ctx.fillStyle = 'rgba(139, 92, 246, 0.25)';
    ctx.beginPath();
    ctx.rect(px + pw, py, pd, ph);
    ctx.fill();
    ctx.stroke();
    
    // Draw top face
    ctx.beginPath();
    ctx.moveTo(px, py);
    ctx.lineTo(px + pd, py - 20);
    ctx.lineTo(px + pw + pd, py - 20);
    ctx.lineTo(px + pw, py);
    ctx.closePath();
    ctx.stroke();
    
    // Draw front faces
    ctx.beginPath();
    ctx.rect(px, py, pw, ph);
    ctx.stroke();
    
    // Draw side connections
    ctx.beginPath();
    ctx.moveTo(px + pd, py - 20);
    ctx.lineTo(px + pd, py - 20 + ph);
    ctx.moveTo(px + pw + pd, py - 20);
    ctx.lineTo(px + pw + pd, py - 20 + ph);
    ctx.moveTo(px + pw, py);
    ctx.lineTo(px + pw + pd, py - 20);
    ctx.stroke();
    
    // Dimensions text
    ctx.font = '12px Outfit, Noto Sans SC';
    ctx.fillStyle = textColor;
    ctx.fillText("宽 = r (3 dm)", px + 5, py + ph + 18);
    ctx.fillText("高 = h (10 dm)", px - 85, py + ph/2);
    ctx.fillText("长 = πr (9.42 dm)", px + pw/2 - 20, py - 25);
    
    // Cutting Face annotation
    ctx.fillStyle = '#8b5cf6';
    ctx.font = 'bold 12px Noto Sans SC';
    ctx.fillText("切面 r×h", px - 10, py + ph/2 - 25);
    ctx.fillText("切面 r×h", px + pw + pd - 30, py + ph/2 - 25);
    
    ctx.font = '14px Noto Sans SC, sans-serif';
    ctx.fillStyle = '#8b5cf6';
    ctx.fillText('增加表面积的秘密：', 24, canvas.height - 75);
    ctx.fillStyle = textColor;
    ctx.fillText('• 切拼后体积没变，但长方体左右两侧多出两个全新的切面！', 24, canvas.height - 52);
    ctx.fillText('• 增加表面积 = 2 × 半径 r × 高 h = 2 × 3 × 10 = 60 dm²。', 24, canvas.height - 30);
  }
  
  saveCanvasState();
}

// 3. Meet Problem Distance/Speed Animation Loop
let animateMeetId = null;
function drawAIMeetProblem(step) {
  const canvas = elements.canvas;
  
  // Stop existing animation if running
  if (animateMeetId) {
    cancelAnimationFrame(animateMeetId);
    animateMeetId = null;
  }
  
  const textColor = state.theme === 'light' ? '#1e293b' : '#f8fafc';
  
  if (step === 0) {
    // Draw Static Meet Problem
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.font = 'bold 16px Noto Sans SC, sans-serif';
    ctx.fillStyle = textColor;
    ctx.fillText('相遇问题：相向而行运动直观', 24, 34);
    
    const cy = canvas.height / 2 - 20;
    const startX = 50;
    const endX = canvas.width - 50;
    
    // Draw road
    ctx.strokeStyle = state.theme === 'light' ? '#94a3b8' : '#475569';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(startX, cy);
    ctx.lineTo(endX, cy);
    ctx.stroke();
    
    // Point A (Left) - Xiao Ming
    ctx.fillStyle = '#10b981';
    ctx.beginPath();
    ctx.arc(startX, cy, 10, 0, 2 * Math.PI);
    ctx.fill();
    ctx.font = '13px Noto Sans SC';
    ctx.fillText("小明 (60米/分)", startX - 20, cy - 25);
    
    // Point B (Right) - Xiao Gang
    ctx.fillStyle = '#ef4444';
    ctx.beginPath();
    ctx.arc(endX, cy, 10, 0, 2 * Math.PI);
    ctx.fill();
    ctx.fillText("小刚 (90米/分)", endX - 80, cy - 25);
    
    // Line label
    ctx.font = '14px Outfit';
    ctx.fillStyle = textColor;
    ctx.textAlign = 'center';
    ctx.fillText("两地总路程：450 米", canvas.width / 2, cy + 30);
    ctx.textAlign = 'left';
    
    ctx.font = '14px Noto Sans SC';
    ctx.fillStyle = '#6366f1';
    ctx.fillText("物理含义：两人相对靠近，每分钟他们之间的距离缩短两个人的速度和。", 24, canvas.height - 40);
  } else {
    // Start Moving Animation
    const cy = canvas.height / 2 - 20;
    const startX = 50;
    const endX = canvas.width - 50;
    const trackWidth = endX - startX;
    
    // Meeting point is 60 / (60+90) = 40% from the left
    const meetX = startX + 0.40 * trackWidth; 
    
    let startTime = null;
    const duration = 2000; // 2 seconds
    
    function animateFrame(timestamp) {
      if (!startTime) startTime = timestamp;
      const progress = Math.min((timestamp - startTime) / duration, 1);
      
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.font = 'bold 16px Noto Sans SC, sans-serif';
      ctx.fillStyle = textColor;
      ctx.fillText('相遇问题：路程每分钟缩短动画', 24, 34);
      
      // Draw road
      ctx.strokeStyle = state.theme === 'light' ? '#94a3b8' : '#475569';
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.moveTo(startX, cy);
      ctx.lineTo(endX, cy);
      ctx.stroke();
      
      // Calculate current A and B coordinates
      const currentXA = startX + progress * (meetX - startX);
      const currentXB = endX - progress * (endX - meetX);
      
      // Draw Green A Dot
      ctx.fillStyle = '#10b981';
      ctx.beginPath();
      ctx.arc(currentXA, cy, 10, 0, 2 * Math.PI);
      ctx.fill();
      ctx.font = '12px Noto Sans SC';
      ctx.fillText("小明 (→ 60m/m)", currentXA - 30, cy - 20);
      
      // Draw Red B Dot
      ctx.fillStyle = '#ef4444';
      ctx.beginPath();
      ctx.arc(currentXB, cy, 10, 0, 2 * Math.PI);
      ctx.fill();
      ctx.fillText("小刚 (← 90m/m)", currentXB - 50, cy - 20);
      
      // Current Distance meter
      const remDistance = Math.max(Math.round(450 * (1 - progress)), 0);
      ctx.font = 'bold 15px Outfit, Noto Sans SC';
      ctx.fillStyle = '#6366f1';
      ctx.textAlign = 'center';
      ctx.fillText(`当前双方距离：${remDistance} 米`, canvas.width / 2, cy + 35);
      ctx.textAlign = 'left';
      
      // Explanatory footnote
      ctx.font = '14px Noto Sans SC';
      if (progress < 1) {
        ctx.fillStyle = textColor;
        ctx.fillText(`• 每分钟缩短：速度之和 (60 + 90) = 150 米。`, 24, canvas.height - 40);
      } else {
        ctx.fillStyle = '#10b981';
        ctx.fillText(`• 已相遇！相遇时间 = 总路程 ÷ 速度和 = 450 ÷ 150 = 3 分钟！`, 24, canvas.height - 40);
        
        // Draw meeting star
        ctx.font = '24px Outfit';
        ctx.fillText('⭐', meetX - 12, cy - 10);
      }
      
      if (progress < 1) {
        animateMeetId = requestAnimationFrame(animateFrame);
      } else {
        animateMeetId = null;
        saveCanvasState();
      }
    }
    
    animateMeetId = requestAnimationFrame(animateFrame);
  }
}

// Draw Preset General Equation Shape (when custom topic has no match)
function drawGeneralEquationShape() {
  const canvas = elements.canvas;
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  
  const textColor = state.theme === 'light' ? '#1e293b' : '#f8fafc';
  
  ctx.font = 'bold 16px Noto Sans SC, sans-serif';
  ctx.fillStyle = textColor;
  ctx.fillText('应用题建模：画板辅助关系图', 24, 34);
  
  const cx = canvas.width / 2;
  const cy = canvas.height / 2 - 20;
  
  // Draw two line blocks (representing X and 3X)
  ctx.strokeStyle = '#6366f1';
  ctx.lineWidth = 3;
  
  // Block 1 (x)
  ctx.beginPath();
  ctx.rect(cx - 100, cy - 40, 50, 20);
  ctx.stroke();
  ctx.font = '12px Outfit';
  ctx.fillStyle = textColor;
  ctx.fillText("x (小明)", cx - 95, cy - 50);
  
  // Block 2 (3x)
  ctx.strokeStyle = '#8b5cf6';
  ctx.beginPath();
  ctx.rect(cx - 100, cy + 10, 150, 20);
  ctx.stroke();
  
  // Dotted lines partitioning 3x block
  ctx.beginPath();
  ctx.setLineDash([3, 3]);
  ctx.moveTo(cx - 50, cy + 10);
  ctx.lineTo(cx - 50, cy + 30);
  ctx.moveTo(cx, cy + 10);
  ctx.lineTo(cx, cy + 30);
  ctx.stroke();
  ctx.setLineDash([]);
  
  ctx.fillText("3x (小华)", cx - 95, cy + 50);
  
  // Bracket showing total
  ctx.strokeStyle = '#ef4444';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(cx + 70, cy - 40);
  ctx.lineTo(cx + 85, cy - 40);
  ctx.lineTo(cx + 85, cy + 30);
  ctx.lineTo(cx + 70, cy + 30);
  ctx.stroke();
  
  ctx.font = 'bold 13px Noto Sans SC';
  ctx.fillStyle = '#ef4444';
  ctx.fillText("合起来共 80 张", cx + 95, cy);
  
  ctx.font = '14px Noto Sans SC';
  ctx.fillStyle = '#6366f1';
  ctx.fillText("等量关系式：小明的张数 + 小华的张数 = 80 张卡片，即 x + 3x = 80", 24, canvas.height - 40);
  
  saveCanvasState();
}

// Parse URL Query parameters for automatic sync
function parseUrlParamsAndStart() {
  const params = new URLSearchParams(window.location.search);
  const grade = params.get('grade');
  const topic = params.get('topic');
  const student = params.get('student');
  const problem = params.get('problem');
  
  if (grade) {
    elements.selectGrade.value = grade;
    updateTopics();
  }
  
  if (topic) {
    elements.selectTopic.value = topic;
    handleTopicChange();
  }
  
  if (problem && topic === 'custom') {
    elements.customProblemText.value = problem;
  }
  
  // Auto-start tutoring session if grade and topic are specified
  if (grade && topic) {
    setTimeout(() => {
      if (student) {
        showToast(`已成功同步学生 ${student} 的说题分析！`);
      }
      startSocraticTutor();
    }, 500);
  }
}

