// Math Explain-Problem AI Commentary System Logic

// Application State
let currentState = {
  currentMode: 'A', // 'A' or 'B'
  theme: 'light',
  apiConfig: {
    base: '',
    key: '',
    model: '',
    whisperModel: 'whisper-1'
  },
  students: [], // List of students parsed from transcript input
  currentStudentIndex: 0,
  processedReports: {}, // Map of student index -> parsed report object
  isAnalyzing: false,
  isRecording: false
};


// DOM Elements
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
  
  btnRecordMic: document.getElementById('btn-record-mic'),
  audioFileUpload: document.getElementById('audio-file-upload'),
  sttProgress: document.getElementById('stt-progress'),
  recordIcon: document.getElementById('record-icon'),
  recordText: document.getElementById('record-text'),
  
  gradeInput: document.getElementById('config-grade'),
  subjectInput: document.getElementById('config-subject'),
  problemSopGroup: document.getElementById('group-problem-a'),
  problemTextGroup: document.getElementById('group-problem-b'),
  problemSop: document.getElementById('problem-sop'),
  problemText: document.getElementById('problem-text'),
  studentNameInput: document.getElementById('student-name'),
  studentClassInput: document.getElementById('student-class'),
  transcriptsInput: document.getElementById('student-transcripts'),

  
  batchArea: document.getElementById('batch-area'),
  batchStatus: document.getElementById('batch-status'),
  batchPrev: document.getElementById('batch-prev'),
  batchNext: document.getElementById('batch-next'),
  
  loadDemoBtn: document.getElementById('btn-load-demo'),
  mockBtn: document.getElementById('btn-mock'),
  analyzeBtn: document.getElementById('btn-analyze'),
  
  emptyState: document.getElementById('empty-state-panel'),
  dashboardContainer: document.getElementById('dashboard-container'),
  loadingOverlay: document.getElementById('loading-overlay'),
  loadingText: document.getElementById('loading-status-text'),
  
  // Dashboard fields
  studentName: document.getElementById('summary-student-name'),
  studentClass: document.getElementById('summary-student-class'),
  taskMode: document.getElementById('summary-task-mode'),
  totalScore: document.getElementById('summary-total-score'),
  scoreRing: document.getElementById('score-ring'),
  
  // Knowledge panel
  knowledgeCard: document.getElementById('knowledge-preview-card'),
  knowledgeTags: document.getElementById('knowledge-tags'),
  knowledgeFocus: document.getElementById('knowledge-focus'),
  knowledgeDifficulty: document.getElementById('knowledge-difficulty'),
  knowledgeMistakes: document.getElementById('knowledge-mistakes'),
  
  // Overall Commentary fields
  totalSummary: document.getElementById('total-summary-content'),
  highlights: document.getElementById('highlight-content'),
  actionAdvice: document.getElementById('action-advice-content'),
  homeworkChallenge: document.getElementById('homework-challenge-content'),
  teacherVerify: document.getElementById('teacher-verify-content'),
  
  // Export buttons
  copyReportBtn: document.getElementById('btn-copy-report'),
  exportPdfBtn: document.getElementById('btn-export-pdf'),
  exportCsvBtn: document.getElementById('btn-export-csv'),
  
  tabsContainer: document.getElementById('dashboard-tabs'),
  socraticEmptyState: document.getElementById('socratic-empty-state'),
  socraticIframeContainer: document.getElementById('socratic-iframe-container'),
  socraticIframe: document.getElementById('socratic-iframe'),
  
  toast: document.getElementById('toast-message')
};

// Initialize Application

window.addEventListener('DOMContentLoaded', () => {
  loadConfig();
  loadTheme();
  setupEventListeners();
  switchMode('A');
});

// Load Config from LocalStorage
function loadConfig() {
  const savedBase = localStorage.getItem('say_math_api_base') || 'https://api.openai.com/v1';
  const savedKey = localStorage.getItem('say_math_api_key') || '';
  const savedModel = localStorage.getItem('say_math_api_model') || 'gpt-4o-mini';
  const savedWhisperModel = localStorage.getItem('say_math_api_whisper_model') || 'whisper-1';
  
  currentState.apiConfig = { base: savedBase, key: savedKey, model: savedModel, whisperModel: savedWhisperModel };
  
  elements.apiBaseInput.value = savedBase;
  elements.apiKeyInput.value = savedKey;
  elements.apiModelInput.value = savedModel;
  elements.apiWhisperModelInput.value = savedWhisperModel;
}

// Load Theme from LocalStorage
function loadTheme() {
  const savedTheme = localStorage.getItem('say_math_theme') || 'light';
  currentState.theme = savedTheme;
  elements.body.setAttribute('data-theme', savedTheme);
}

// Save Theme
function toggleTheme() {
  currentState.theme = currentState.theme === 'light' ? 'dark' : 'light';
  elements.body.setAttribute('data-theme', currentState.theme);
  localStorage.setItem('say_math_theme', currentState.theme);
  showToast(`已切换至${currentState.theme === 'light' ? '日间' : '夜间'}模式`);
}

// Setup Event Listeners
function setupEventListeners() {
  elements.themeToggle.addEventListener('click', toggleTheme);
  elements.openConfigBtn.addEventListener('click', () => toggleModal(true));
  elements.closeConfigBtn.addEventListener('click', () => toggleModal(false));
  elements.cancelConfigBtn.addEventListener('click', () => toggleModal(false));
  elements.saveConfigBtn.addEventListener('click', saveConfig);
  
  elements.loadDemoBtn.addEventListener('click', loadDemoData);
  elements.mockBtn.addEventListener('click', runOfflineMock);
  elements.analyzeBtn.addEventListener('click', runOnlineAnalysis);
  
  elements.btnRecordMic.addEventListener('click', toggleMicRecording);
  elements.audioFileUpload.addEventListener('change', handleAudioFileUpload);
  
  elements.transcriptsInput.addEventListener('input', parseInputStudents);
  elements.batchPrev.addEventListener('click', () => navigateStudent(-1));
  elements.batchNext.addEventListener('click', () => navigateStudent(1));
  
  elements.copyReportBtn.addEventListener('click', copyMarkdownReport);
  elements.exportPdfBtn.addEventListener('click', () => window.print());
  elements.exportCsvBtn.addEventListener('click', exportToCSV);
}



// Toggle Modal
function toggleModal(show) {
  if (show) {
    elements.configModal.classList.add('active');
  } else {
    elements.configModal.classList.remove('active');
  }
}

// Save Config to LocalStorage
function saveConfig() {
  const base = elements.apiBaseInput.value.trim();
  const key = elements.apiKeyInput.value.trim();
  const model = elements.apiModelInput.value.trim();
  const whisperModel = elements.apiWhisperModelInput.value.trim() || 'whisper-1';
  
  if (!key) {
    showToast('请输入 API 密钥以配置联调功能！', true);
  }
  
  localStorage.setItem('say_math_api_base', base);
  localStorage.setItem('say_math_api_key', key);
  localStorage.setItem('say_math_api_model', model);
  localStorage.setItem('say_math_api_whisper_model', whisperModel);
  
  currentState.apiConfig = { base, key, model, whisperModel };
  toggleModal(false);
  showToast('API 参数保存成功！');
}


// Show Toast Notification
function showToast(message, isError = false) {
  elements.toast.textContent = message;
  elements.toast.style.background = isError ? 'var(--color-empty)' : '#1e293b';
  elements.toast.classList.add('show');
  setTimeout(() => {
    elements.toast.classList.remove('show');
  }, 3000);
}

// Switch Mode (A同题 / B个性)
function switchMode(mode) {
  currentState.currentMode = mode;
  const modeABtn = document.getElementById('mode-a-btn');
  const modeBBtn = document.getElementById('mode-b-btn');
  
  if (mode === 'A') {
    modeABtn.classList.add('active');
    modeBBtn.classList.remove('active');
    elements.problemSopGroup.style.display = 'flex';
    elements.problemTextGroup.style.display = 'none';
  } else {
    modeABtn.classList.remove('active');
    modeBBtn.classList.add('active');
    elements.problemSopGroup.style.display = 'none';
    elements.problemTextGroup.style.display = 'flex';
  }
}

// Load Demo Data
const demoData = {
  A: {
    problem: "组合图形面积（大长方形长10厘米，宽6厘米；旁边拼接一个小正方形边长6厘米。求阴影部分面积，阴影部分为整体拼合图形减去中间空白梯形部分）。\n参考答案与SOP分析：\n1. 拼合后的大图形总面积：长方形面积(10x6) + 正方形面积(6x6) = 60 + 36 = 96平方厘米。\n2. 中间空白部分的形状：一个梯形，其上底是正方形的边长（6厘米），下底是大长方形的长（10厘米），高是长方形的宽/正方形边长（6厘米）。\n3. 空白梯形面积：(6 + 10) x 6 / 2 = 16 x 3 = 48平方厘米。\n4. 阴影部分面积 = 总面积 - 空白梯形面积 = 96 - 48 = 48平方厘米。",
    students: `学生姓名：王小兵
转写内容：“我是用大长方形面积加上小正方形面积，再减去中间三角形的面积。大长方形是10乘6等于60，正方形是6乘6等于36，加起来是96。中间那个空白的，它是一个梯形，上底是6，下底是10，高是6，所以是6加10的和乘6除以2等于48。最后96减48等于48。我讲完了。”
---
学生姓名：李莉莉
转写内容：“这道题求的是阴影面积。我们先求两个图形合起来的面积，10乘6是60，6乘6是36，加在一起是96平方厘米。然后再减去中间那个长方形，它的面积是10乘6等于60，最后是96减60等于36平方厘米。老师，我讲的对吗？”`
  },
  B: {
    problem: "解决实际问题：小明和小刚从相距450米的两地同时出发，相向而行。小明每分钟走60米，小刚每分钟走90米，几分钟后两人相遇？",
    students: `学生姓名：赵雷
转写内容：“这道题求的是相遇时间。我们知道总路程是450米，小明速度60，小刚速度90。他们是相对着走的，所以速度要加起来。也就是一分钟他们一共能走60加90等于150米。要求几分钟相遇，就用450除以150等于3。所以是3分钟相遇。我可以验算一下，3乘60是180，3乘90是270，180加270正好是450米。算对了！”`
  }
};

function loadDemoData() {
  const mode = currentState.currentMode;
  if (mode === 'A') {
    elements.problemSop.value = demoData.A.problem;
    elements.studentNameInput.value = "";
    elements.studentClassInput.value = "五(1)班";
    elements.transcriptsInput.value = demoData.A.students;
  } else {
    elements.problemText.value = demoData.B.problem;
    elements.studentNameInput.value = "";
    elements.studentClassInput.value = "五(2)班";
    elements.transcriptsInput.value = demoData.B.students;
  }
  parseInputStudents();
  showToast(`已成功载入模式 ${mode} 的演示数据！`);
}

// Parse Input Text into Multiple Students
function parseInputStudents() {
  const text = elements.transcriptsInput.value.trim();
  if (!text) {
    currentState.students = [];
    updateBatchUI();
    return;
  }

  // Split by "---" to support multiple students
  const blocks = text.split(/\n\s*---\s*\n|\n---\n|---/);
  
  currentState.students = blocks.map((block, idx) => {
    const lines = block.trim().split('\n');
    let name = '';
    let transcriptText = '';
    
    // Attempt to extract name
    const nameMatch = block.match(/(?:学生姓名|姓名|学生|编号)[：:]\s*([^\n]+)/i);
    if (nameMatch) {
      name = nameMatch[1].trim();
    } else {
      name = `学生 ${idx + 1}`;
    }
    
    // Extract transcript body
    const transMatch = block.match(/(?:转写内容|转写稿|原话|说题内容)[：:]([\s\S]+)/i);
    if (transMatch) {
      transcriptText = transMatch[1].trim();
    } else {
      // If no labels, clean the lines and merge them
      transcriptText = lines.filter(l => !l.match(/(?:学生姓名|姓名|学生|编号|班级)[：:]/i)).join('\n').trim();
    }
    
    return {
      name: name,
      rawBlock: block,
      transcript: transcriptText
    };
  });
  
  currentState.currentStudentIndex = 0;
  updateBatchUI();
}

// Update Batch navigation Bar UI
function updateBatchUI() {
  const count = currentState.students.length;
  if (count <= 1) {
    elements.batchArea.style.display = 'none';
  } else {
    elements.batchArea.style.display = 'flex';
    elements.batchStatus.textContent = `已解析出 ${count} 个学生档案（当前第 ${currentState.currentStudentIndex + 1} 个）`;
    elements.batchPrev.disabled = currentState.currentStudentIndex === 0;
    elements.batchNext.disabled = currentState.currentStudentIndex === count - 1;
  }
}

// Navigate Student in Batch
function navigateStudent(direction) {
  const newIndex = currentState.currentStudentIndex + direction;
  if (newIndex >= 0 && newIndex < currentState.students.length) {
    currentState.currentStudentIndex = newIndex;
    updateBatchUI();
    
    // Check if report already generated, and render it
    if (currentState.processedReports[newIndex]) {
      renderReport(currentState.processedReports[newIndex]);
    } else {
      // Clear dashboard to remind user to generate
      elements.emptyState.style.display = 'flex';
      if (elements.socraticEmptyState) elements.socraticEmptyState.style.display = 'flex';
      
      elements.dashboardContainer.style.display = 'none';
      if (elements.socraticIframeContainer) elements.socraticIframeContainer.style.display = 'none';
      
      elements.emptyState.querySelector('p').textContent = `当前学生：${currentState.students[newIndex].name}，尚未生成点评报告。点击“开始智能点评”或“离线模拟”运行分析。`;
    }
  }
}

// Render Report to Dashboard
function renderReport(report) {
  elements.emptyState.style.display = 'none';
  if (elements.socraticEmptyState) elements.socraticEmptyState.style.display = 'none';
  
  elements.dashboardContainer.style.display = 'block';
  if (elements.socraticIframeContainer) elements.socraticIframeContainer.style.display = 'block';
  
  // Sync the Socratic whiteboard agent iframe in Column 3
  syncSocraticIframe(report);

  
  // Meta Info
  elements.studentName.textContent = report.studentName || '未指定';
  elements.studentClass.textContent = report.studentClass || '未分组';
  elements.taskMode.textContent = report.taskMode || (currentState.currentMode === 'A' ? 'A 同题模式' : 'B 个性题模式');
  elements.taskMode.className = `mode-badge ${currentState.currentMode === 'A' ? 'a-mode' : 'b-mode'}`;
  
  // Total Score Ring (Animates)
  elements.totalScore.textContent = report.totalScore;
  const maxScore = 20;
  const percentage = Math.min(100, Math.max(0, (parseFloat(report.totalScore) / maxScore) * 100));
  const radius = 40;
  const circumference = 2 * Math.PI * radius; // ~251.2
  const offset = circumference - (percentage / 100) * circumference;
  elements.scoreRing.style.strokeDashoffset = offset;

  // Render Horizontal mini bars & Card details
  for (let i = 1; i <= 5; i++) {
    const dim = report.dimensions[i];
    const valSpan = document.getElementById(`val-dim-${i}`);
    const barFill = document.getElementById(`bar-dim-${i}`);
    
    // Check if score is number or string (like ◇)
    const isVerify = dim.score === '待复核' || dim.score === '◇';
    valSpan.textContent = isVerify ? '◇ 待复核' : `${dim.score}${dim.symbol || ''}`;
    
    // Update mini horizontal progress bar
    if (isVerify) {
      barFill.style.width = '0%';
      barFill.style.background = 'var(--color-verify)';
    } else {
      const scoreNum = parseFloat(dim.score) || 0;
      barFill.style.width = `${(scoreNum / 4) * 100}%`;
      
      // Select bar color based on score value
      if (scoreNum === 4) barFill.style.background = 'var(--color-star)';
      else if (scoreNum >= 3) barFill.style.background = 'var(--color-circle)';
      else if (scoreNum >= 2) barFill.style.background = 'var(--color-triangle)';
      else barFill.style.background = 'var(--color-empty)';
    }

    // Update Detail Card
    const cardBadge = document.getElementById(`badge-dim-${i}`);
    cardBadge.textContent = isVerify ? '◇ 待复核' : `${dim.score} ${dim.symbol}`;
    
    // Set Badge color class
    cardBadge.className = 'dimension-badge';
    if (isVerify) cardBadge.classList.add('badge-verify');
    else {
      const scoreNum = parseFloat(dim.score) || 0;
      if (scoreNum === 4) cardBadge.classList.add('badge-star');
      else if (scoreNum >= 3) cardBadge.classList.add('badge-circle');
      else if (scoreNum >= 2) cardBadge.classList.add('badge-triangle');
      else cardBadge.classList.add('badge-empty');
    }

    document.getElementById(`evidence-dim-${i}`).textContent = dim.evidence || '无具体证据';
    document.getElementById(`reason-dim-${i}`).textContent = dim.reason || '无';
    document.getElementById(`good-dim-${i}`).textContent = dim.good || '无';
    document.getElementById(`bad-dim-${i}`).textContent = dim.bad || '无';
    document.getElementById(`fix-dim-${i}`).textContent = dim.howToFix || '无';
  }

  // Render Knowledge Point Details (B Mode)
  if (currentState.currentMode === 'B' && report.knowledge) {
    elements.knowledgeCard.style.display = 'flex';
    elements.knowledgeTags.innerHTML = '';
    
    // Split tags
    const tags = (report.knowledge.points || '').split(/[,，、]/);
    tags.forEach(t => {
      if (t.trim()) {
        const tagSpan = document.createElement('span');
        tagSpan.className = 'knowledge-tag';
        tagSpan.textContent = t.trim();
        elements.knowledgeTags.appendChild(tagSpan);
      }
    });
    
    elements.knowledgeFocus.textContent = report.knowledge.focus || '无';
    elements.knowledgeDifficulty.textContent = report.knowledge.difficulty || '无';
    elements.knowledgeMistakes.textContent = report.knowledge.mistakes || '无';
  } else {
    elements.knowledgeCard.style.display = 'none';
  }

  // General Commentaries
  elements.totalSummary.textContent = report.totalSummary || '无';
  elements.highlights.textContent = report.highlight || '无';
  elements.actionAdvice.textContent = report.advice || '无';
  elements.homeworkChallenge.textContent = report.homework || '本次无需举一反三';
  
  // Teacher verification box
  elements.teacherVerify.textContent = report.verification || '暂无异常';
}

// Parse Markdown Text Output into a Structured JS Object
function parseMarkdownOutput(markdownText) {
  const report = {
    studentName: '',
    studentClass: '',
    taskMode: '',
    totalScore: '0',
    dimensions: {},
    knowledge: null,
    totalSummary: '',
    highlight: '',
    advice: '',
    homework: '',
    verification: '',
    rawMarkdown: markdownText
  };

  // Pre-clean linebreaks
  const lines = markdownText.split('\n');

  // Extract Student details
  for (let line of lines) {
    const nameMatch = line.match(/(?:学生姓名或编号|学生姓名|姓名|学生)[：:]\s*([^\n]+)/i);
    if (nameMatch) report.studentName = nameMatch[1].trim();

    const classMatch = line.match(/(?:班级)[：:]\s*([^\n]+)/i);
    if (classMatch) report.studentClass = classMatch[1].trim();

    const modeMatch = line.match(/(?:任务模式)[：:]\s*([^\n]+)/i);
    if (modeMatch) report.taskMode = modeMatch[1].trim();
  }

  if (!report.studentName) {
    // Attempt fallback from current state
    const currentStudent = currentState.students[currentState.currentStudentIndex];
    if (currentStudent) report.studentName = currentStudent.name;
  }
  if (!report.studentClass) {
    report.studentClass = elements.studentClassInput.value.trim() || '未分组';
  }

  // Segment Markdown by sections
  const sections = {};
  let currentHeader = 'intro';
  sections[currentHeader] = [];

  for (let line of lines) {
    if (line.match(/^#+\s+/)) continue; // skip level 1 title headers
    
    const scoreSectionMatch = line.match(/^(?:一[、.，\s]|评分)/);
    const dimSectionMatch = line.match(/^(?:二[、.，\s]|五个维度点评)/);
    const summarySectionMatch = line.match(/^(?:三[、.，\s]|总评)/);
    const highlightSectionMatch = line.match(/^(?:四[、.，\s]|亮点)/);
    const adviceSectionMatch = line.match(/^(?:五[、.，\s]|建议)/);
    const hwSectionMatch = line.match(/^(?:六[、.，\s]|举一反三)/);
    const verifySectionMatch = line.match(/^(?:七[、.，\s]|复核提醒)/);
    
    if (scoreSectionMatch) { currentHeader = 'score'; sections[currentHeader] = []; }
    else if (dimSectionMatch) { currentHeader = 'dims'; sections[currentHeader] = []; }
    else if (summarySectionMatch) { currentHeader = 'summary'; sections[currentHeader] = []; }
    else if (highlightSectionMatch) { currentHeader = 'highlight'; sections[currentHeader] = []; }
    else if (adviceSectionMatch) { currentHeader = 'advice'; sections[currentHeader] = []; }
    else if (hwSectionMatch) { currentHeader = 'homework'; sections[currentHeader] = []; }
    else if (verifySectionMatch) { currentHeader = 'verify'; sections[currentHeader] = []; }
    else {
      sections[currentHeader].push(line);
    }
  }

  // Parse Scores Section
  if (sections['score']) {
    const scoreText = sections['score'].join('\n');
    const totalMatch = scoreText.match(/总分[：:\s]*([0-9.◇度]+)/i);
    if (totalMatch) report.totalScore = totalMatch[1].trim();

    // Try extracting 5 individual scores
    // Expected: 审题与理解 [分数]；思路与建模 [分数]；...
    const matches = scoreText.matchAll(/(?:审题与理解|思路与建模|解题与算理|数学语言与表达|讲解呈现与反思|数学语言表达|呈现与反思)[：:\s]*([0-9.◇度a-zA-Z\u4e00-\u9fa5]+)/g);
    let idx = 1;
    for (const match of matches) {
      if (idx <= 5) {
        if (!report.dimensions[idx]) report.dimensions[idx] = {};
        report.dimensions[idx].score = match[1].trim();
        idx++;
      }
    }
  }

  // Parse B Mode Knowledge section if B mode active
  if (currentState.currentMode === 'B') {
    report.knowledge = { points: '', focus: '', difficulty: '', mistakes: '' };
    const introText = sections['intro'] ? sections['intro'].join('\n') : '';
    
    const kpMatch = introText.match(/(?:【知识点】|知识点)[：:\s]*([^\n]+)/i);
    const focusMatch = introText.match(/(?:【重点\/难点】|【重点】|重点)[：:\s]*([^\n]+)/i);
    const diffMatch = introText.match(/(?:难点)[：:\s]*([^\n]+)/i);
    const mistMatch = introText.match(/(?:【易错点】|易错点)[：:\s]*([^\n]+)/i);
    
    if (kpMatch) report.knowledge.points = kpMatch[1].trim();
    if (focusMatch) report.knowledge.focus = focusMatch[1].trim();
    if (diffMatch) report.knowledge.difficulty = diffMatch[1].trim();
    else if (focusMatch && focusMatch[1].includes('，')) {
      // fallback split
      const parts = focusMatch[1].split('，');
      report.knowledge.focus = parts[0];
      report.knowledge.difficulty = parts[1] || '';
    }
    if (mistMatch) report.knowledge.mistakes = mistMatch[1].trim();
  }

  // Parse Dims Section
  // Expected structure:
  // 1. 审题与理解：[得分][符号]｜证据：[学生原话]｜评分理由：[理由]｜做得好的地方：[优点]｜需要改进的地方：[缺点]｜怎么改：[修改方式]
  if (sections['dims']) {
    const dimText = sections['dims'].join('\n');
    const dimLines = dimText.split('\n').filter(l => l.trim().match(/^[1-5][.、]\s*/));
    
    dimLines.forEach(line => {
      const numMatch = line.match(/^([1-5])[.、]\s*(?:审题与理解|思路与建模|解题与算理|数学语言与表达|讲解呈现与反思|数学语言表达|呈现与反思)[：:\s]*/);
      if (numMatch) {
        const dimIndex = parseInt(numMatch[1]);
        if (!report.dimensions[dimIndex]) report.dimensions[dimIndex] = {};
        
        // Remove number prefix
        const contentPart = line.substring(numMatch[0].length).trim();
        
        // Split by piping characters
        const parts = contentPart.split(/[|｜]/);
        
        // Parts[0] should be "Score + Symbol" (e.g. "3.5分●" or "4★")
        if (parts[0]) {
          const scoreSymbol = parts[0].trim();
          const scoreMatch = scoreSymbol.match(/([0-9.◇度]+)\s*(?:分)?\s*([★●△○◇]?)/);
          if (scoreMatch) {
            report.dimensions[dimIndex].score = scoreMatch[1];
            report.dimensions[dimIndex].symbol = scoreMatch[2] || getSymbolForScore(parseFloat(scoreMatch[1]));
          }
        }
        
        // Parse key-value mappings like "证据: x", "评分理由: y"
        parts.forEach((part, partIdx) => {
          const cleanPart = part.trim();
          const kvMatch = cleanPart.match(/^(?:证据|评分理由|做得好的地方|做得好|需要改进的地方|需要改进|怎么改|怎么修改|改进空间)[：:\s]*([\s\S]+)$/i);
          if (kvMatch) {
            const label = kvMatch[0].split(/[：:]/)[0].trim();
            const val = kvMatch[1].trim();
            
            if (label.includes('证据')) report.dimensions[dimIndex].evidence = val;
            else if (label.includes('理由')) report.dimensions[dimIndex].reason = val;
            else if (label.includes('做得好')) report.dimensions[dimIndex].good = val;
            else if (label.includes('改进') || label.includes('空间')) report.dimensions[dimIndex].bad = val;
            else if (label.includes('怎么改') || label.includes('怎么修改')) report.dimensions[dimIndex].howToFix = val;
          } else if (partIdx > 0) {
            // fallback index-based assignments if LLM omitted headers
            if (partIdx === 1 && !report.dimensions[dimIndex].evidence) report.dimensions[dimIndex].evidence = cleanPart;
            else if (partIdx === 2 && !report.dimensions[dimIndex].reason) report.dimensions[dimIndex].reason = cleanPart;
            else if (partIdx === 3 && !report.dimensions[dimIndex].good) report.dimensions[dimIndex].good = cleanPart;
            else if (partIdx === 4 && !report.dimensions[dimIndex].bad) report.dimensions[dimIndex].bad = cleanPart;
            else if (partIdx === 5 && !report.dimensions[dimIndex].howToFix) report.dimensions[dimIndex].howToFix = cleanPart;
          }
        });
      }
    });
  }

  // Populate missing dimension properties to keep structure healthy
  for (let i = 1; i <= 5; i++) {
    if (!report.dimensions[i]) {
      report.dimensions[i] = { score: '◇', symbol: '◇', evidence: '-', reason: '-', good: '-', bad: '-', howToFix: '-' };
    } else {
      if (!report.dimensions[i].score) report.dimensions[i].score = '◇';
      if (!report.dimensions[i].symbol) report.dimensions[i].symbol = '◇';
      if (!report.dimensions[i].evidence) report.dimensions[i].evidence = '-';
      if (!report.dimensions[i].reason) report.dimensions[i].reason = '-';
      if (!report.dimensions[i].good) report.dimensions[i].good = '-';
      if (!report.dimensions[i].bad) report.dimensions[i].bad = '-';
      if (!report.dimensions[i].howToFix) report.dimensions[i].howToFix = '-';
    }
  }

  // Parse remaining texts
  report.totalSummary = sections['summary'] ? sections['summary'].join('\n').trim() : '未生成';
  report.highlight = sections['highlight'] ? sections['highlight'].join('\n').trim() : '未生成';
  report.advice = sections['advice'] ? sections['advice'].join('\n').trim() : '未生成';
  report.homework = sections['homework'] ? sections['homework'].join('\n').trim() : '未生成';
  report.verification = sections['verify'] ? sections['verify'].join('\n').trim() : '暂无异常';

  // Strip prefixes if generated in content
  report.totalSummary = report.totalSummary.replace(/^[、.\s]*/, '');
  report.highlight = report.highlight.replace(/^[、.\s]*/, '');
  report.advice = report.advice.replace(/^[、.\s]*/, '');
  report.homework = report.homework.replace(/^[、.\s]*/, '');
  report.verification = report.verification.replace(/^[、.\s]*/, '');

  return report;
}

// Fallback Symbol Mapper
function getSymbolForScore(score) {
  if (isNaN(score)) return '◇';
  if (score === 4) return '★';
  if (score >= 3) return '●';
  if (score >= 2) return '△';
  return '○';
}

// Loading Demo Data Automatically and triggers mock for UX quickstart
function loadDemoAndRunMock() {
  loadDemoData();
  runOfflineMock();
}

// RUN OFFLINE MOCK GENERATION
function runOfflineMock() {
  const currentStudent = currentState.students[currentState.currentStudentIndex];
  if (!currentStudent) {
    showToast('请先输入学生说题文稿！', true);
    return;
  }

  setLoadingState(true, '离线解析引擎启动中...<br><span style="font-size: 12px; font-weight: normal; color: var(--text-muted);">正在计算五维数学量规指标</span>');

  setTimeout(() => {
    let mockMD = '';
    const studentName = currentStudent.name || '王小兵';
    const currentClass = elements.studentClassInput.value.trim() || '五(1)班';

    if (currentState.currentMode === 'A') {
      if (studentName.includes('李莉莉')) {
        mockMD = `学生姓名或编号：李莉莉
任务模式：A同题模式

一、评分
总分：10.5 / 20分
五维得分：审题与理解2.5；思路与建模2.5；解题与算理2；数学语言与表达2；讲解呈现与反思1.5。

二、五个维度点评
1. 审题与理解：2.5分△｜证据：学生说“减去中间那个长方形，它的面积是10乘6等于60”｜评分理由：能够找出通过大图形面积减去空白面积求解阴影的方法，但将中间空白处的“梯形”错读为“长方形”，导致关键条件理解错误。｜做得好的地方：认识到了组合图形相减的数量关系。｜需要改进的地方：图形形状识别错误。｜怎么改：开口前仔细对照图形特征，指出“中间空白部分是一个梯形”。
2. 思路与建模：2.5分△｜证据：“先求两个图形合起来的面积...减去中间那个长方形”｜评分理由：搭建了整体减部分的割补面积算式模型，但由于形状建模失误，导致求差的模型数据失配。｜做得好的地方：建立了整体减局部的转化思维。｜需要改进的地方：空白处的建模不符合题意，长方形公式代入不合理。｜怎么改：讲解时要分析各部分属性，确定中间是梯形，需要运用梯形公式。
3. 解题与算理：2分△｜证据：“长方形面积是10乘6等于60，最后是96减60等于36”｜评分理由：计算过程结果无错误，但是计算的物理对象错误，把梯形算理套用成大长方形。｜做得好的地方：加法和减法计算结果准确。｜需要改进的地方：计算的算理依据出现严重偏离。｜怎么改：改用梯形面积公式“（上底+下底）× 高 ÷ 2”来计算中间的空白面积。
4. 数学语言与表达：2分△｜证据：“中间那个长方形”、“老师，我讲的对吗”｜评分理由：能有条理表达思路，但数学术语使用不准确，口语化指代多。｜做得好的地方：表达连贯没有出现长时卡顿。｜需要改进的地方：专业几何术语欠妥，反问句不适用于正式说题。｜怎么改：用“拼合图形的面积”代替“合起来的面积”，最后用陈述句收尾。
5. 讲解呈现与反思：1.5分○｜证据：“老师，我讲的对吗？”没有做检验，直接结束。｜评分理由：讲解虽然完整，但没有任何反思、逆向检验及结论确认。｜做得好的地方：完成了说题的全流程。｜需要改进的地方：缺少结果推导复核，且存在不自信的询问。｜怎么改：算完后加上“我来检验一下，由于36平方厘米加60平方厘米等于96平方厘米，面积大小合理。所以答句是...”。

三、总评
李莉莉同学在这次说题中展现了清晰的割补图形求解框架（总面积-空白面积），但在细节识别上存在重大失误，将中间的“梯形”误认为“长方形”，导致算理完全偏离，最终结果也发生了差错。后续需要加强对基本几何图形特征的观察与面积公式的准确记忆。

四、亮点
在面对组合图形时能够主动作出“分合转化”，先把左右两个基本图形相加，建立了良好的大面积构建思维。

五、建议
下一次只练一个动作：在动手算中间空白图形前，用手指顺着图形边缘画一圈，先大声说出它的图形名称，再列式。

六、举一反三（按需）
补说任务：请不要计算，看着本题图片录制一段 10 秒的视频，指着中间空白处说出它叫什么图形，以及这个图形是由哪几条线段围成的。
训练目的：强化对复杂图形中空白梯形属性的几何特征直观认识。

七、复核提醒
1. 教师需核实学生在视频中指点图形的位置，转写稿确认学生确实误读了形状，而非系统转录错误。
2. 建议对该学生进行线段长宽数据提取的面对面微辅导。`;
      } else {
        // Default Mock A (Wang Xiaobing)
        mockMD = `学生姓名或编号：${studentName}
任务模式：A同题模式

一、评分
总分：16.5 / 20分
五维得分：审题与理解3.5；思路与建模4；解题与算理3；数学语言与表达3；讲解呈现与反思3。

二、五个维度点评
1. 审题与理解：3.5分●｜证据：学生指出“用大长方形面积加上小正方形面积，再减去中间三角形...不对，是梯形”｜评分理由：能正确理解大图形与空白部分的关系，但刚开始把梯形错口说成三角形后自行进行了纠正｜做得好的地方：能自我察觉图形概念并快速修正｜需要改进的地方：概念表述的最初严谨性｜怎么改：开口说题前，先闭眼默念一遍核心图形的名称“梯形”，确保一次说准。
2. 思路与建模：4分★｜证据：“我是用大长方形面积加上小正方形面积，再减去中间面积”｜评分理由：建模非常完美，成功构建了“长方形+正方形-梯形=阴影”的面积代数模型，思路顺畅｜做得好的地方：能够把多合一复杂图形解构为常见基础模型｜需要改进的地方：无｜怎么改：继续保持先总述模型方法再细化列式的习惯。
3. 解题与算理：3分●｜证据：“它的上底是6，下底是10，高是6，所以是6加10的和乘6除以2等于48。最后96减48等于48”｜评分理由：公式及数值计算百分百正确，但未在说题中解释为什么梯形上底是6（小正方形边长）、下底是10（大长方形长）｜做得好的地方：分步算理清晰，计算过程极为稳健｜需要改进的地方：关键隐藏数据没有提供来源的几何依据解释｜怎么改：在报出梯形尺寸时，先加上说明“因为正方形边长是6，长方形长是10，所以梯形上下底是6和10”。
4. 数学语言与表达：3分●｜证据：“中间那个空白的”、“加起来是96”、“除以2”｜评分理由：讲解逻辑十分顺畅，但使用了部分口语化代词和非标准术语｜做得好的地方：逻辑衔接紧密，能让听者清晰听到计算链条｜需要改进的地方：提高数学术语的规范程度｜怎么改：将“加起来等于”替换为“大图形的面积之和是”，将“除以2”说成“除以2”。
5. 讲解呈现与反思：3分●｜证据：“最后96减48等于48。我讲完了。”｜评分理由：讲解主干极其完整，但收尾较急，未进行单位检查以及回扣最终求阴影面积的提问｜做得好的地方：表达自信，流畅度极高｜需要改进的地方：缺乏反思检查和完整答句｜怎么改：在得出48后，补一句“所以阴影部分的面积是48平方厘米，这正是题目所求”。

三、总评
${studentName}同学能够熟练驾驭“整体减去空白部分”这一经典几何割补思路。计算过程扎实，思路开阔。主要优化空间在于几何数据推理的显性化说明，以及在口头表达时多使用严谨的数学名词。整体表现值得肯定。

四、亮点
具有优秀的自我纠错意识。在说出“三角形”后能瞬间反应并自行更正为“梯形”，反应迅速，图形直觉良好。

五、建议
下一次只练一个动作：在报出任何几何算式数据前，先自问自答一句“这个数在图里是怎么得来的”。

六、举一反三（按需）
补说任务：无需重新计算全题，请说一说“如果右侧小正方形边长改为4厘米，中间的空白梯形面积算式会发生什么改变”。
训练目的：强化学生对于组合图形重合边长的动态关联感知。

七、复核提醒
转写稿中学生在中间处有个微小的自我修正动作，建议核听音视频确认该生是纯属口误纠正，还是概念存在过犹豫。`;
      }
    } else {
      // Mock B (Zhao Lei)
      mockMD = `学生姓名或编号：${studentName}
任务模式：B个性题模式
【知识点】解决相遇问题中的时间推导
【重点/难点】理解速度和的物理意义，运用公式“路程 ÷ 速度和 = 相遇时间”进行数学建模
【易错点】误将两个人的速度做差，或者将速度直接与总路程挂钩而非速度和

一、评分
总分：19 / 20分
五维得分：审题与理解4；思路与建模4；解题与算理3.5；数学语言与表达3.5；讲解呈现与反思4。

二、五个维度点评
1. 审题与理解：4分★｜证据：“总路程是450米，小明速度60，小刚速度90，相向而行，几分钟相遇”｜评分理由：能够将题目中的所有显性物理量（路程、双方速度）以及隐性方向状态（相向而行）完整复述，审题十分细致｜做得好的地方：清晰指出了“相对着走”这一运动关系｜需要改进的地方：无｜怎么改：保持这种将已知和所求一一对应列出的好习惯。
2. 思路与建模：4分★｜证据：“他们是相对着走的，速度要加起来。一分钟他们一共能走60加90等于150米”｜评分理由：完美解析了“相向相遇”的核心物理模型，能通过解释“速度和”将路程差问题转化为相遇模型｜做得好的地方：对“速度加起来”有深度的算理理解并能说清意义｜需要改进的地方：无｜怎么改：继续保持对模型内涵进行合理解释的讲述结构。
3. 解题与算理：3.5分●｜证据：“450除以150等于3。所以是3分钟相遇”｜评分理由：计算结果和公式应用无挑剔，但没有说出这个综合除法算式的数学公式依据（即路程除以速度和等于相遇时间）｜做得好的地方：计算极其精确｜需要改进的地方：公式定理的总结性陈述稍显欠缺｜怎么改：列式除法前，加上一句“根据‘路程 ÷ 速度和 = 相遇时间’的公式，我们可以列出式子...”。
4. 数学语言与表达：3.5分●｜证据：“速度加起来”、“相对着走”｜评分理由：讲述通顺流畅，但在速度和的表达上使用了较多的生活用语，数学术语化程度还可以进一步拔高｜做得好的地方：逻辑衔接很顺，没有废话｜需要改进的地方：表达可以用更专业的“速度和”、“相向而行”｜怎么改：将“相对着走速度加起来”规范为“由于他们是相向而行，我们需要求出两人的速度和”。
5. 讲解呈现与反思：4分★｜证据：“我可以验算一下，3乘60是180，3乘90是270，180加270正好是450米。算对了！”｜评分理由：极具亮点！不仅得出了正确结论，并且能够主动通过逆向求总路程的方法进行乘法验算，体现了出色的高阶思维与严谨态度｜做得好的地方：主动验算，反思意识极强｜需要改进的地方：无｜怎么改：保持在所有说题和做题中主动进行逆向验算或估算的好习惯。

三、总评
${studentName}同学在本次说题中表现极为优异。他对相遇问题中“速度和”的本质含义解释得透彻明白，计算精准，特别是能够主动进行全面的数字逆向验算，这种反思和验算习惯非常宝贵，是学好数学的优秀品质。

四、亮点
在说题结尾进行了极具逻辑的“逆向相遇路程和”自主验算，算理正确，展现了自我监控学习过程的高阶思维能力。

五、建议
下一次只练一个动作：在列出最终算式时，报出背后的数学原理公式，例如说出“路程除以速度和等于相遇时间”。

六、举一反三（按需）
本次无需举一反三。学生对相遇问题的本质、计算和反思均已掌握到优秀级别，暂时无需额外补充同类基础挑战。

七、复核提醒
该生表现优秀，数学表达能力突出。建议作为班级“说题示范音视频”推荐给其他同学参考学习。`;
      }
    }

    const report = parseMarkdownOutput(mockMD);
    currentState.processedReports[currentState.currentStudentIndex] = report;
    renderReport(report);
    setLoadingState(false);
    showToast(`成功离线模拟生成 ${studentName} 的点评报告！`);
  }, 1200);
}

// RUN REAL ONLINE ANALYSIS WITH API
async function runOnlineAnalysis() {
  const currentStudent = currentState.students[currentState.currentStudentIndex];
  if (!currentStudent) {
    showToast('请先输入学生说题文稿！', true);
    return;
  }

  const { base, key, model } = currentState.apiConfig;
  if (!key) {
    showToast('请先配置您的 API Key！可点击右上角“API配置”进行设置。', true);
    toggleModal(true);
    return;
  }

  setLoadingState(true, '大模型正开动脑筋分析中...<br><span style="font-size: 12px; font-weight: normal; color: var(--text-muted);">正在分析材料、提炼原话证据并计算五维得分</span>');

  const grade = elements.gradeInput.value.trim() || '五年级';
  const subject = elements.subjectInput.value.trim() || '数学';
  const mode = currentState.currentMode;
  
  // Construct System Prompt
  const systemPrompt = `你是一名精通小学数学教学、深谙【${grade}】学生认知发展特点的一线【${subject}】骨干教师。你的任务是根据学生“说题”的视频/音频转写文稿以及题目材料，从审题、思路、算理、语言、呈现五个维度，为学生生成一份“有原话证据、可客观复核、有具体行动建议”的个性化点评。

# Goals
1. 依据客观证据评价：点评必须紧扣学生说题的“原话”，严禁无证据的主观臆断。
2. 严防猜测与幻觉：转写不清晰时标注“待核听”，不将转写错误归咎于学生。
3. 提供行动化建议：改进建议要明确到下一次能直接照做的微动作。
4. 区分权限与受众：输出内容需分清“教师可见”、“个人（学生/家长）可见”与“公开可见”的边界。

# Inputs & Material Checking
你将接收到以下材料，请根据材料完整度进行自适应处理：
1. 【必需】学生说题的文本/转写稿（含学生原话，可能包含学生姓名、编号）。
2. 【参考材料】题目文本/图片、参考答案、教师题目分析或SOP。

# Mode Decision Logic
本次处理模式为【${mode === 'A' ? 'A同题模式' : 'B个性题模式'}】。
* **【A同题模式】**：直接使用材料中已有的题目分析、参考答案或SOP，核对学生有没有说到、是否说准、理由是否充分；不得擅自改变教师已确认的题目结论。
* **【B个性题模式】**：先简要识别该题的知识点、重点、难点和易错点，再依据学生原话进行点评。

# Grading & Rubric System
每个维度 0-4 分，允许 0.5 分，满分 20 分。评分符号对应如下：
- ★ 4分：证据充分、准确完整，能清晰解释关键数学理由。
- ● 3 - 3.5分：主体正确，但存在一处不够清楚或不够完整。
- △ 2 - 2.5分：部分理解或部分正确，存在关键概念或步骤缺口。
- ○ 0 - 1.5分：明显偏离题意、方法或结果，且缺少有效解释说明。
- ◇ 待复核：因材料缺失、转写严重不清而无法确认时使用，不计入0分，保留悬决状态。

## 五维评估口径：
1. **审题与理解**：能否说清已知条件、所求问题、关键词、单位及条件间的关系；有无漏条件、误读条件或答非所问。
2. **思路与建模**：能否选择合适方法将实际情境转化为数学模型；是否说清“为什么这样想”。
3. **解题与算理**：计算、公式、单位和结果是否正确；步骤是否完整；能否说清每一步“求什么”以及“依据”。
4. **数学语言与表达**：术语、符号、单位、语句是否准确；表达是否有顺序、前后连贯。
5. **讲解呈现与反思**：讲解是否完整、有重点；是否进行了结果检验、回扣问题、说明易错点，或对方法进行比较与反思。

# Rules & Constraints
1. 始终坚持忠实原话，未说内容严禁推断。
2. 转写模糊或疑似专业名词、数字出错时在证据中标记【待核听：具体内容】，切勿强行判错。
3. 数学解法包容，只要原理成立，不同于标准答案不能扣分。
4. 答案正确但原因说不清的，算理维度必须扣分并在怎么改中说明。
5. 总分必须等于五维得分之和，重新算准。

# Output Format
严格按照以下格式输出，不得省略任何标题和字段：

学生姓名或编号：[姓名]
任务模式：[A同题模式 / B个性题模式]
${mode === 'B' ? '【知识点】[点]\n【重点/难点】[重点/难点]\n【易错点】[易错点]\n' : ''}
一、评分
总分：[得分] / 20分
五维得分：审题与理解 [分数]；思路与建模 [分数]；解题与算理 [分数]；数学语言与表达 [分数]；讲解呈现与反思 [分数]。

二、五个维度点评
1. 审题与理解：[得分][符号]｜证据：[原话]｜评分理由：[理由]｜做得好的地方：[优点]｜需要改进的地方：[缺点]｜怎么改：[改法]
2. 思路与建模：[得分][符号]｜证据：[原话]｜评分理由：[理由]｜做得好的地方：[优点]｜需要改进的地方：[缺点]｜怎么改：[改法]
3. 解题与算理：[得分][符号]｜证据：[原话]｜评分理由：[理由]｜做得好的地方：[优点]｜需要改进的地方：[缺点]｜怎么改：[改法]
4. 数学语言与表达：[得分][符号]｜证据：[原话]｜评分理由：[理由]｜做得好的地方：[优点]｜需要改进的地方：[缺点]｜怎么改：[改法]
5. 讲解呈现与反思：[得分][符号]｜证据：[原话]｜评分理由：[理由]｜做得好的地方：[优点]｜需要改进的地方：[缺点]｜怎么改：[改法]

三、总评
[综合评价，100字左右]

四、亮点
[一个有原话证据、值得公开发表的优势表现，教师审核后可公开]

五、建议
[一个下一次可以直接照做的小动作行动建议，仅教师、家长、个人可见]

六、举一反三（按需）
[1道针对性巩固或挑战任务，若无写“本次无需举一反三”]

七、复核提醒
[仅教师可见的复核、待核听内容，若无写“暂无”]`;

  // Construct User Prompt
  let userPrompt = '';
  if (mode === 'A') {
    userPrompt = `【题目及教师SOP材料】：
${elements.problemSop.value.trim()}

【待点评学生基本信息】：
学生姓名/编号：${currentStudent.name}
所属班级：${elements.studentClassInput.value.trim() || '未分组'}

【学生说题原话转写稿】：
${currentStudent.transcript}

请按照系统规定的格式输出点评报告。`;
  } else {
    userPrompt = `【题目材料（选填）】：
${elements.problemText.value.trim() || '未提供题目，请从说题转写稿中提取推理'}

【待点评学生基本信息】：
学生姓名/编号：${currentStudent.name}
所属班级：${elements.studentClassInput.value.trim() || '未分组'}

【学生说题原话转写稿】：
${currentStudent.transcript}

请按照系统规定的格式输出点评报告。`;
  }

  try {
    const url = base.endsWith('/') ? `${base}chat/completions` : `${base}/chat/completions`;
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${key}`
      },
      body: JSON.stringify({
        model: model,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        temperature: 0.2
      })
    });

    if (!response.ok) {
      throw new Error(`API 请求失败，状态码: ${response.status}`);
    }

    const data = await response.json();
    const mdResult = data.choices[0].message.content;
    
    // Parse and render
    const parsedReport = parseMarkdownOutput(mdResult);
    currentState.processedReports[currentState.currentStudentIndex] = parsedReport;
    
    renderReport(parsedReport);
    showToast(`智能点评成功（${currentStudent.name}）！`);
  } catch (error) {
    console.error('API Error:', error);
    showToast(`点评失败: ${error.message}，您可以点击“离线模拟”查看展示效果。`, true);
  } finally {
    setLoadingState(false);
  }
}

// Manage Loading Overlay
function setLoadingState(loading, text = '') {
  currentState.isAnalyzing = loading;
  if (loading) {
    elements.loadingOverlay.style.display = 'flex';
    elements.loadingText.innerHTML = text;
    elements.analyzeBtn.disabled = true;
    elements.mockBtn.disabled = true;
  } else {
    elements.loadingOverlay.style.display = 'none';
    elements.analyzeBtn.disabled = false;
    elements.mockBtn.disabled = false;
  }
}

// Copy Markdown Report to Clipboard
function copyMarkdownReport() {
  const currentReport = currentState.processedReports[currentState.currentStudentIndex];
  if (!currentReport || !currentReport.rawMarkdown) {
    showToast('暂无报告可复制！', true);
    return;
  }
  
  navigator.clipboard.writeText(currentReport.rawMarkdown)
    .then(() => showToast('Markdown 点评报告已成功复制到剪贴板！'))
    .catch(err => {
      console.error('Copy fail:', err);
      showToast('复制失败，请手动在控制台复制。', true);
    });
}

// Export parsed history as CSV
function exportToCSV() {
  const reports = Object.values(currentState.processedReports);
  if (reports.length === 0) {
    showToast('没有已分析完成的学生数据可供导出！', true);
    return;
  }

  let csvContent = '\uFEFF'; // UTF-8 BOM
  csvContent += '学生姓名,班级,任务模式,总分,审题评分,思路评分,算理评分,语言评分,呈现评分,综合总评,闪光亮点,核心改进建议,复核提醒\n';
  
  reports.forEach(r => {
    const row = [
      escapeCSV(r.studentName),
      escapeCSV(r.studentClass),
      escapeCSV(r.taskMode),
      escapeCSV(r.totalScore),
      escapeCSV(r.dimensions[1].score),
      escapeCSV(r.dimensions[2].score),
      escapeCSV(r.dimensions[3].score),
      escapeCSV(r.dimensions[4].score),
      escapeCSV(r.dimensions[5].score),
      escapeCSV(r.totalSummary),
      escapeCSV(r.highlight),
      escapeCSV(r.advice),
      escapeCSV(r.verification)
    ].join(',');
    csvContent += row + '\n';
  });

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `数学说题点评汇总_${new Date().toISOString().slice(0,10)}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  showToast('点评汇总表格已成功导出！');
}

function escapeCSV(text) {
  if (!text) return '""';
  let formatted = text.replace(/"/g, '""');
  if (formatted.includes(',') || formatted.includes('\n') || formatted.includes('"')) {
    formatted = `"${formatted}"`;
  }
  return formatted;
}

// === Speech to Text (STT) Feature Extensions ===

let recognition = null;

// Toggle Web Speech Recognition for mic dictation
function toggleMicRecording() {
  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (!SpeechRecognition) {
    showToast('您的浏览器不支持原生语音识别，请尝试使用 Chrome 浏览器，或通过文件上传进行转录。', true);
    return;
  }

  if (currentState.isRecording) {
    // Stop recording
    if (recognition) {
      recognition.stop();
    }
  } else {
    // Start recording
    recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = false;
    recognition.lang = 'zh-CN';

    recognition.onstart = () => {
      currentState.isRecording = true;
      elements.btnRecordMic.classList.add('recording');
      elements.recordIcon.textContent = '⏹';
      elements.recordText.textContent = '正在录音...点击停止';
      showToast('正在麦克风录音中，请开始说题...');
    };

    recognition.onresult = (event) => {
      const currentResult = event.results[event.results.length - 1][0].transcript;
      const currentVal = elements.transcriptsInput.value.trim();
      
      // Auto-append transcript segment
      const separator = currentVal ? '\n' : '';
      elements.transcriptsInput.value = currentVal + separator + currentResult;
      
      // Refresh students batch list
      parseInputStudents();
    };

    recognition.onerror = (event) => {
      console.error('Speech recognition error:', event.error);
      showToast(`语音识别出错: ${event.error}`, true);
      stopRecordingUI();
    };

    recognition.onend = () => {
      stopRecordingUI();
      showToast('麦克风录音已停止。');
    };

    recognition.start();
  }
}

function stopRecordingUI() {
  currentState.isRecording = false;
  elements.btnRecordMic.classList.remove('recording');
  elements.recordIcon.textContent = '🎤';
  elements.recordText.textContent = '录音说题';
}

// Handle Audio/Video file upload
function handleAudioFileUpload(event) {
  const file = event.target.files[0];
  if (!file) return;

  // 1. Auto-extract student name from filename
  // Examples: "张三-说题.mp3" -> "张三", "王小兵.mp4" -> "王小兵"
  const fileNameNoExt = file.name.substring(0, file.name.lastIndexOf('.')) || file.name;
  // Regex to extract the first Chinese name or text segment
  const nameMatch = fileNameNoExt.match(/^([a-zA-Z\u4e00-\u9fa5]+)(?:说题|说课|数学|-[0-9]+|\(\d+\))?/i);
  let extractedName = nameMatch && nameMatch[1] ? nameMatch[1].trim() : fileNameNoExt;

  
  // Set student metadata inputs
  elements.studentNameInput.value = extractedName;
  showToast(`已检测到音视频文件：${file.name}，自动提取学生姓名：${extractedName}`);

  const { base, key } = currentState.apiConfig;

  // 2. Fallback to mock transcription if API Key is not set
  if (!key) {
    showToast('未配置 API 密钥，已自动启动本地离线语音转写模拟！');
    elements.sttProgress.style.display = 'block';

    setTimeout(() => {
      let mockTranscript = '';
      if (currentState.currentMode === 'A') {
        mockTranscript = `学生姓名：${extractedName}\n转写内容：“我是用大长方形面积加上小正方形面积，再减去中间三角形的面积。大长方形是10乘6等于60，正方形是6乘6等于36，加起来是96。中间那个空白的，它是一个梯形，上底是6，下底是10，高是6，所以是6加10的和乘6除以2等于48。最后96减48等于48。我讲完了。”`;
      } else {
        mockTranscript = `学生姓名：${extractedName}\n转写内容：“这道题求的是相遇时间。我们知道总路程是450米，小明速度60，小刚速度90。他们是相对着走的，所以速度要加起来。也就是一分钟他们一共能走60加90等于150米。要求几分钟相遇，就用450除以150等于3。所以是3分钟相遇。我可以验算一下，3乘60是180，3乘90是270，180加270正好是450米。算对了！”`;
      }

      // Fill in text area
      const currentVal = elements.transcriptsInput.value.trim();
      const prefix = currentVal ? `${currentVal}\n---\n` : '';
      elements.transcriptsInput.value = prefix + mockTranscript;
      
      elements.sttProgress.style.display = 'none';
      parseInputStudents();
      showToast('离线转录文本已成功填入说题区！');
    }, 1500);
    
    return;
  }

  // 3. Trigger online transcription via Whisper
  transcribeAudioFile(file, extractedName);
}

// Transcribe Audio via OpenAI-compatible Whisper API
async function transcribeAudioFile(file, studentName) {
  elements.sttProgress.style.display = 'block';
  showToast('开始上传音视频文件到转写服务，请稍候...');

  const { base, key, whisperModel } = currentState.apiConfig;
  const url = base.endsWith('/') ? `${base}audio/transcriptions` : `${base}/audio/transcriptions`;

  const formData = new FormData();
  formData.append('file', file);
  formData.append('model', whisperModel || 'whisper-1');
  formData.append('language', 'zh');

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${key}`
      },
      body: formData
    });

    if (!response.ok) {
      throw new Error(`语音转录请求失败，HTTP 状态码: ${response.status}`);
    }

    const data = await response.json();
    const transcriptText = data.text || '';

    if (!transcriptText) {
      throw new Error('未返回任何转写文本内容。');
    }

    // Format transcript block
    const formattedTranscript = `学生姓名：${studentName}\n转写内容：“${transcriptText}”`;
    
    // Append to textarea
    const currentVal = elements.transcriptsInput.value.trim();
    const prefix = currentVal ? `${currentVal}\n---\n` : '';
    elements.transcriptsInput.value = prefix + formattedTranscript;

    parseInputStudents();
    showToast(`音视频 ${file.name} 智能转录成功！`);
  } catch (error) {
    console.error('STT API Error:', error);
    showToast(`云端语音转文字失败: ${error.message}。可再次点击以重新尝试。`, true);
  } finally {
    elements.sttProgress.style.display = 'none';
  }
}

// === Socratic Questioning Agent Tab & Dialog Feature ===

// Tab switcher
function switchDashboardTab(tab) {
  currentState.currentTab = tab;
  
  if (tab === 'report') {
    elements.tabReportBtn.classList.add('active');
    elements.tabSocraticBtn.classList.remove('active');
    elements.dashboardContainer.style.display = 'block';
    elements.socraticChatContainer.style.display = 'none';
  } else {
    elements.tabReportBtn.classList.remove('active');
    elements.tabSocraticBtn.classList.add('active');
    elements.dashboardContainer.style.display = 'none';
    elements.socraticChatContainer.style.display = 'flex';
    initSocraticChat();
  }
}

// Initialize Socratic conversation
function initSocraticChat() {
  const currentStudent = currentState.students[currentState.currentStudentIndex];
  if (!currentStudent) {
    showToast('无可用学生说题文稿来初始化苏格拉底对话！', true);
    return;
  }

  const report = currentState.processedReports[currentState.currentStudentIndex];
  if (!report) {
    showToast('请先运行分析或模拟生成点评报告，以开启苏格拉底追问！', true);
    switchDashboardTab('report');
    return;
  }

  // Check if we need to initialize or reset
  const hasHistory = currentState.socraticChatHistory.length > 0;
  const belongsToCurrent = currentState.socraticChatHistory.studentIndex === currentState.currentStudentIndex;

  if (hasHistory && belongsToCurrent) {
    // Keep existing history, just re-render to be safe
    renderChatBubbles();
    return;
  }

  // Clear history and start a fresh session
  currentState.socraticChatHistory = [];
  currentState.socraticChatHistory.studentIndex = currentState.currentStudentIndex;
  currentState.socraticRound = 0;

  // Show inline loader
  setSocraticLoading(true);

  setTimeout(async () => {
    let initialGreeting = '';
    
    const studentName = report.studentName || '同学';
    const { key } = currentState.apiConfig;

    // Use Mock Initial Greeters Offline
    if (!key) {
      if (studentName.includes('小兵')) {
        initialGreeting = `小兵你好！我听了你的说题，大体思路非常棒。不过我注意到你在求空白梯形面积时，直接说它的下底是10厘米，高是6厘米。你能告诉我，你是怎么从图里发现这两个数据的吗？`;
      } else if (studentName.includes('莉莉')) {
        initialGreeting = `莉莉你好！听到你积极尝试解决这道组合图形题，老师非常高兴。你提到要减去中间那个长方形，我们来仔细观察一下中间那个空白图形，它真的是一个长方形吗？它有几条边？`;
      } else if (studentName.includes('赵雷')) {
        initialGreeting = `赵雷你好！你对相遇问题的分析非常透彻。你提到为了求相遇时间，需要用总路程除以他们的速度和（60+90=150米/分）。你能具体讲一讲，为什么是把速度加起来，而不是用大速度减去小速度呢？`;
      } else {
        initialGreeting = `你好，${studentName}！很高兴听你分享你的说题思路。在你的讲解中，计算非常迅速。不过，你能详细和老师说说，你在列出核心算式之前，是怎么理清题目里这几个数据之间的关系的吗？`;
      }
      
      currentState.socraticChatHistory.push({ role: 'assistant', content: initialGreeting });
      renderChatBubbles();
      setSocraticLoading(false);
      populateQuickPills();
      return;
    }

    // Online generation of the first question
    try {
      const systemPrompt = `你是一个苏格拉底启发式数学辅导老师。针对以下小学生的数学说题，你需要写一个亲切的开头，并针对他表现中的最大缺失（通常在低分维度或评分理由中），抛出**一个**简单的、启发式提问，引导他自己思考并补充，而不是直接给出错误点或正确答案。
提示：
1. 态度极度亲切、温和，适合小学五年级学生。
2. 保持简短（不超过90字）。
3. 只问一个问题，不要长篇大论。
4. 绝对不要说出正确计算结果或判定对错，引导他去阐述。`;

      const userPrompt = `【说题学生】：${studentName}
【题目及SOP】：${elements.problemSop.value.trim() || elements.problemText.value.trim()}
【学生原话转写】：${currentStudent.transcript}
【五维点评摘要】：${report.totalSummary}
【改进建议】：${report.advice}`;

      const { base, key, model } = currentState.apiConfig;
      const url = base.endsWith('/') ? `${base}chat/completions` : `${base}/chat/completions`;

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${key}`
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

      if (!response.ok) throw new Error('接口失败');

      const data = await response.json();
      initialGreeting = data.choices[0].message.content.trim();
      
      currentState.socraticChatHistory.push({ role: 'assistant', content: initialGreeting });
      renderChatBubbles();
    } catch (e) {
      console.error(e);
      // Fallback greeting if API error
      const fallback = `你好，${studentName}！听到你精彩的说题，老师想问问你，关于这道题的最后一步算式，你是依据什么算理列出来的呢？`;
      currentState.socraticChatHistory.push({ role: 'assistant', content: fallback });
      renderChatBubbles();
    } finally {
      setSocraticLoading(false);
      populateQuickPills();
    }
  }, 800);
}

// Populate Quick reply capsules below chat input
function populateQuickPills() {
  const report = currentState.processedReports[currentState.currentStudentIndex];
  const studentName = report ? report.studentName : '';
  const pillsContainer = elements.socraticQuickPills;
  pillsContainer.innerHTML = '';

  let pills = [];
  if (studentName.includes('小兵')) {
    if (currentState.socraticRound === 0) {
      pills = ['因为小正方形的边长是6厘米，大长方形长是10厘米', '我不确定，老师能给我讲讲吗？'];
    } else if (currentState.socraticRound === 1) {
      pills = ['因为它们在下面是连在一起的，高也是正方形的边', '我不太会描述，但看到线是重合的'];
    } else {
      pills = ['我懂了，下次说题我会把重合的边长先解释清楚！', '谢谢老师的启发！'];
    }
  } else if (studentName.includes('莉莉')) {
    if (currentState.socraticRound === 0) {
      pills = ['它有四条边，它不是长方形吗？', '它好像只有上下两条边是平行的，高是6'];
    } else if (currentState.socraticRound === 1) {
      pills = ['我知道了！这是一组对边平行的梯形！', '它的面积公式是 (上底+下底)×高÷2'];
    } else {
      pills = ['我明白了，我不该把它算成长方形！', '谢谢老师，我会重新算一遍！'];
    }
  } else if (studentName.includes('赵雷')) {
    if (currentState.socraticRound === 0) {
      pills = ['因为相向而行，两个人的速度加在一起表示一分钟一共走的路程', '我不知道，我只是硬记的公式'];
    } else if (currentState.socraticRound === 1) {
      pills = ['如果是追及，每分钟缩短路程是速度差，所以用相除', '追及问题我还需要想一下'];
    } else {
      pills = ['我以后会把速度和的物理意义说出来！', '乘法验算让我觉得算得更踏实！'];
    }
  } else {
    pills = ['我明白这道题的思路了。', '老师能再解释一下这个地方吗？', '谢谢老师的引导！'];
  }

  pills.forEach(text => {
    const pill = document.createElement('button');
    pill.className = 'pill-btn';
    pill.textContent = text;
    pill.onclick = () => sendQuickPillReply(text);
    pillsContainer.appendChild(pill);
  });
}

// Send user message
async function sendSocraticMessage() {
  const text = elements.chatUserInput.value.trim();
  if (!text) return;

  elements.chatUserInput.value = '';
  
  // Append student message
  currentState.socraticChatHistory.push({ role: 'user', content: text });
  renderChatBubbles();
  
  currentState.socraticRound++;

  const { key } = currentState.apiConfig;

  // 1. Offline Simulation
  if (!key) {
    setSocraticLoading(true);
    setTimeout(() => {
      runOfflineSocraticChat(text);
      setSocraticLoading(false);
      populateQuickPills();
    }, 1000);
    return;
  }

  // 2. Online multiround chat loop
  setSocraticLoading(true);
  try {
    const report = currentState.processedReports[currentState.currentStudentIndex];
    const studentName = report ? report.studentName : '同学';
    
    const systemPrompt = `你是一个苏格拉底式的数学启发辅导老师。当前你正在和学生【${studentName}】进行一问一答。
数学问题是：${elements.problemSop.value.trim() || elements.problemText.value.trim()}
学生最初的错误说题原文是：${currentState.students[currentState.currentStudentIndex].transcript}

你的任务是：根据对话历史，继续给学生抛出【一个】简单、启发性的提问（不超过80字），引导他自己想明白他的错误并说清算理。
约束：
1. 坚决不能直接透露正确算式、结果或直接批判错误。
2. 保持鼓励和亲和，语句口语化，适合五年级小学生。
3. 保持简短，绝不超过80字。
4. 如果学生已经完全说清或者纠错成功，请给予热烈赞扬并结束本轮学习（赞扬可以包含你发现他的优点）。`;

    const requestMessages = [
      { role: 'system', content: systemPrompt },
      ...currentState.socraticChatHistory
    ];

    const { base, key: apiKey, model } = currentState.apiConfig;
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

    if (!response.ok) throw new Error('回复生成失败');

    const data = await response.json();
    const reply = data.choices[0].message.content.trim();

    currentState.socraticChatHistory.push({ role: 'assistant', content: reply });
    renderChatBubbles();
  } catch (error) {
    console.error(error);
    const errReply = `听了你的想法，很有意思！老师想请你再仔细看一看图，大长方形和正方形拼在一起之后，中间那条边对这两个图形分别意味着什么呢？`;
    currentState.socraticChatHistory.push({ role: 'assistant', content: errReply });
    renderChatBubbles();
  } finally {
    setSocraticLoading(false);
    populateQuickPills();
  }
}

// Quick click capsule pill sender
function sendQuickPillReply(text) {
  elements.chatUserInput.value = text;
  sendSocraticMessage();
}

// Render conversation logs as chat bubbles
function renderChatBubbles() {
  const chatBody = elements.socraticChatBody;
  chatBody.innerHTML = '';

  const report = currentState.processedReports[currentState.currentStudentIndex];
  const studentName = report ? report.studentName : '学生';

  currentState.socraticChatHistory.forEach(msg => {
    const bubble = document.createElement('div');
    const isAI = msg.role === 'assistant';
    bubble.className = `chat-bubble ${isAI ? 'bubble-ai' : 'bubble-student'}`;

    // Avatar
    const avatar = document.createElement('div');
    avatar.className = `chat-avatar ${isAI ? 'avatar-ai' : 'avatar-student'}`;
    avatar.textContent = isAI ? '∑' : studentName.charAt(0);

    // Text Container
    const contentWrapper = document.createElement('div');
    contentWrapper.className = 'bubble-content-wrapper';

    const sender = document.createElement('div');
    sender.className = 'bubble-sender';
    sender.textContent = isAI ? '苏格拉底老师' : studentName;

    const textEl = document.createElement('div');
    textEl.className = 'bubble-text';
    textEl.textContent = msg.content;

    contentWrapper.appendChild(sender);
    contentWrapper.appendChild(textEl);
    
    bubble.appendChild(avatar);
    bubble.appendChild(contentWrapper);

    chatBody.appendChild(bubble);
  });

  // Scroll to bottom
  chatBody.scrollTop = chatBody.scrollHeight;
}

// Offline multi-turn dialogue state engine
function runOfflineSocraticChat(userText) {
  const report = currentState.processedReports[currentState.currentStudentIndex];
  const studentName = report ? report.studentName : '';
  let responseText = '';

  if (studentName.includes('小兵')) {
    if (currentState.socraticRound === 1) {
      responseText = `原来是这样！你观察得很仔细。那你能具体说说，为什么小正方形的边长刚好就是梯形的高？大长方形的长刚好就是梯形的下底呢？它们在图里有什么重合的地方吗？`;
    } else if (currentState.socraticRound === 2) {
      responseText = `太棒了！你指出了它们是重合拼在一起的，这正是关键原因。下一次说题时，如果能把这个重合的发现大声说出来，你的说题就逻辑百分百严密了！你觉得自己今天说题还有什么小口误吗？`;
    } else {
      responseText = `不客气，今天你的纠错非常成功，你已经掌握了组合图形面积转化重合的秘密！继续保持说题的热情，老师看好你！`;
    }
  } else if (studentName.includes('莉莉')) {
    if (currentState.socraticRound === 1) {
      responseText = `非常棒！你发现了它其实不是长方形，因为它的一组对边长度是6厘米和10厘米（不相等），这其实是一个梯形。既然它是梯形，你能回忆一下，求它的面积应该套用什么公式呢？`;
    } else if (currentState.socraticRound === 2) {
      responseText = `完全正确！就是 (上底 + 下底) × 高 ÷ 2，代入数据就是 (6 + 10) × 6 ÷ 2 = 48。你看，只要改用梯形公式，原先减去60的算式是不是就该修改了？修改后的最终答案是多少呢？`;
    } else {
      responseText = `太了不起了，莉莉！你不仅发现了图形形状的错误，还自己纠正了计算，得出了正确的阴影面积是 48 平方厘米！这种自我修正的能力是学数学最棒的财富，为你点赞！`;
    }
  } else if (studentName.includes('赵雷')) {
    if (currentState.socraticRound === 1) {
      responseText = `非常好！相向而行确实是一分钟两人缩短的距离。那如果老师把题目改一下：“小刚和小明在两地，小刚在后面追赶小明”，此时他们一分钟缩短的距离，又该怎么列式呢？物理含义又是什么？`;
    } else if (currentState.socraticRound === 2) {
      responseText = `极具慧眼！同向追及就需要用“速度差”。这样你就能轻松总结出“追及时间 = 路程差 ÷ 速度差”。你觉得自己在今天说题中表现最好的是什么地方？`;
    } else {
      responseText = `没错！你主动进行乘法逆向检验的习惯堪称教科书级别的严谨。很多同学做对结果就结束了，而你做到了双向确认，老师要给你打满分！加油！`;
    }
  } else {
    if (currentState.socraticRound === 1) {
      responseText = `很有趣的想法！你能再深入和老师解释一下，在这个步骤中你计算的数学依据（算理）到底是什么吗？`;
    } else if (currentState.socraticRound === 2) {
      responseText = `说得非常有道理。通过你的解释，老师也完全听懂了。你认为在表达上，怎么说能让班里没听懂的同学也一下听明白呢？`;
    } else {
      responseText = `太赞了！今天的数学思考很有深度，不仅说清了思路，还想到了教学化表达。为你的探索精神点赞，今天就到这里，加油！`;
    }
  }

  currentState.socraticChatHistory.push({ role: 'assistant', content: responseText });
  renderChatBubbles();
}

// Dictate answers in chat using SpeechRecognition
let chatRecognition = null;
function toggleChatMicRecording() {
  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (!SpeechRecognition) {
    showToast('您的浏览器不支持语音识别。请使用 Chrome 浏览器。', true);
    return;
  }

  if (currentState.isSocraticRecording) {
    if (chatRecognition) {
      chatRecognition.stop();
    }
  } else {
    chatRecognition = new SpeechRecognition();
    chatRecognition.continuous = false; // Stop automatically when student pauses
    chatRecognition.interimResults = false;
    chatRecognition.lang = 'zh-CN';

    chatRecognition.onstart = () => {
      currentState.isSocraticRecording = true;
      elements.btnChatMic.classList.add('recording');
      elements.btnChatMic.textContent = '⏹';
      showToast('正在录音回答，请说话...');
    };

    chatRecognition.onresult = (event) => {
      const resultText = event.results[0][0].transcript;
      elements.chatUserInput.value = resultText;
    };

    chatRecognition.onerror = (event) => {
      console.error('Chat mic error:', event.error);
      showToast(`录音失败: ${event.error}`, true);
      stopChatMicUI();
    };

    chatRecognition.onend = () => {
      stopChatMicUI();
      // Auto-send if student spoke something
      if (elements.chatUserInput.value.trim()) {
        sendSocraticMessage();
      }
    };

    chatRecognition.start();
  }
}

function stopChatMicUI() {
  currentState.isSocraticRecording = false;
  elements.btnChatMic.classList.remove('recording');
  elements.btnChatMic.textContent = '🎤';
}

// Reset chat log
function resetSocraticChat() {
  currentState.socraticChatHistory = [];
  currentState.socraticRound = 0;
  initSocraticChat();
  showToast('对话已重置，启发式辅导重新开启！');
}

// Helper to handle chat loading overlay
function setSocraticLoading(loading) {
  if (elements.socraticLoading) {
    if (loading) {
      elements.socraticLoading.style.display = 'flex';
    } else {
      elements.socraticLoading.style.display = 'none';
    }
  }
}

// Sync the Socratic Whiteboard Iframe in Column 3
function syncSocraticIframe(report) {
  const iframe = document.getElementById('socratic-iframe');
  if (!iframe) return;
  
  let gradeNum = '5';
  const gradeText = report.studentClass || elements.studentClassInput.value || '';
  if (gradeText.includes('六')) {
    gradeNum = '6';
  }
  
  let topicVal = 'custom';
  const problemText = ((elements.problemSop.value || '') + ' ' + (elements.problemText.value || '')).toLowerCase();
  if (problemText.includes('鸡') || problemText.includes('兔')) {
    topicVal = 'chicken-rabbit';
  } else if (problemText.includes('圆柱') || problemText.includes('体积') || problemText.includes('切拼')) {
    topicVal = 'cylinder-volume';
  } else if (problemText.includes('相遇') || problemText.includes('路程') || problemText.includes('速度')) {
    topicVal = 'meet-problems';
  } else if (problemText.includes('工程') || problemText.includes('修路')) {
    topicVal = 'work-problems';
  } else if (problemText.includes('方程') || problemText.includes('等量')) {
    topicVal = 'simple-equations';
  } else if (problemText.includes('比') || problemText.includes('比例')) {
    topicVal = 'ratio-proportions';
  } else if (problemText.includes('百分数') || problemText.includes('涨价')) {
    topicVal = 'percentage-change';
  } else if (problemText.includes('多边形') || problemText.includes('面积')) {
    topicVal = 'polygon-areas';
  }
  
  let src = `../苏格拉底数学追问智能体/index.html?grade=${gradeNum}&topic=${topicVal}`;
  
  // Pass the student's name
  src += `&student=${encodeURIComponent(report.studentName || '学生')}`;
  
  // Pass the custom problem if topic is custom
  if (topicVal === 'custom') {
    const rawProblem = elements.problemSop.value.trim() || elements.problemText.value.trim();
    src += `&problem=${encodeURIComponent(rawProblem)}`;
  }
  
  iframe.src = src;
}


