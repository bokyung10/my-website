
// Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyAXZKdkx72F2GvM7qaynr5r9agAMAiVX2s",
  authDomain: "commonpjt-fd9ed.firebaseapp.com",
  databaseURL: "https://commonpjt-fd9ed-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "commonpjt-fd9ed",
  storageBucket: "commonpjt-fd9ed.firebasestorage.app",
  messagingSenderId: "653463134970",
  appId: "1:653463134970:web:8301b6f3a2bde8da201f43"
};

// Firebase 초기화
let database;

// 페이지 로드 시 Firebase 초기화
document.addEventListener('DOMContentLoaded', async () => {
  try {
    // Firebase 모듈 동적 로드
    const { initializeApp } = await import('https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js');
    const { getDatabase, ref, get } = await import('https://www.gstatic.com/firebasejs/10.7.1/firebase-database.js');
    
    // Firebase 앱 초기화
    const app = initializeApp(firebaseConfig);
    database = getDatabase(app);
    
    console.log('Firebase 연결됨');
    
  } catch (error) {
    console.error('Firebase 초기화 실패:', error);
    const container = document.getElementById('dataContainer');
    container.innerHTML = `<div class="error-message">Firebase 초기화에 실패했습니다: ${error.message}</div>`;
  }
});

// 데이터베이스 전체 데이터 로드
async function loadDatabaseData() {
  if (!database) {
    alert('Firebase가 초기화되지 않았습니다.');
    return;
  }
  
  showLoading(true);
  
  try {
    const { ref, get } = await import('https://www.gstatic.com/firebasejs/10.7.1/firebase-database.js');
    const dbRef = ref(database, '/');
    const snapshot = await get(dbRef);
    
    const container = document.getElementById('dataContainer');
    
    if (snapshot.exists()) {
      const data = snapshot.val();
      const stats = generateDataStats(data);
      const statsText = Object.entries(stats.dataTypes)
        .map(([type, count]) => `${type}: ${count}`)
        .join(', ');
      
      container.innerHTML = `
        <div class="data-header">데이터베이스 내용</div>
        <div class="data-content">
          <div class="success-message">데이터를 성공적으로 불러왔습니다.</div>
          <div class="data-stats">
            <strong>통계:</strong> 총 키 개수: ${stats.totalKeys}, 최대 깊이: ${stats.depth}, 데이터 타입: ${statsText}
          </div>
          <div class="data-tree">${formatDataForDisplay(data)}</div>
        </div>
      `;
    } else {
      container.innerHTML = '<div class="error-message">데이터베이스가 비어있습니다.</div>';
    }
  } catch (error) {
    console.error('데이터 로드 실패:', error);
    const container = document.getElementById('dataContainer');
    container.innerHTML = `<div class="error-message">데이터 로드에 실패했습니다: ${error.message}</div>`;
  }
  
  showLoading(false);
}



// 데이터를 표시용으로 포맷
function formatDataForDisplay(data, indent = 0, path = '') {
  if (data === null) {
    return '<span class="data-null">null</span><span class="data-type-badge">null</span>';
  }
  
  if (typeof data === 'string') {
    return `<span class="data-string">"${escapeHtml(data)}"</span><span class="data-type-badge">string</span>`;
  }
  
  if (typeof data === 'number') {
    return `<span class="data-number">${data}</span><span class="data-type-badge">number</span>`;
  }
  
  if (typeof data === 'boolean') {
    return `<span class="data-boolean">${data}</span><span class="data-type-badge">boolean</span>`;
  }
  
  if (Array.isArray(data)) {
    const uniqueId = `array_${Math.random().toString(36).substr(2, 9)}`;
    const itemCount = data.length;
    
    if (itemCount === 0) {
      return `<span class="data-expandable" onclick="toggleExpand('${uniqueId}')">[]</span><span class="data-type-badge">array (empty)</span>`;
    }
    
    const items = data.map((item, index) => {
      const indentStr = '  '.repeat(indent + 1);
      return `${indentStr}<div class="data-object-key"><span class="data-key">[${index}]:</span> ${formatDataForDisplay(item, indent + 1, `${path}[${index}]`)}</div>`;
    });
    
    const indentStr = '  '.repeat(indent);
    return `<span class="data-expandable expanded" onclick="toggleExpand('${uniqueId}')">[</span><span class="data-type-badge">array (${itemCount})</span>
<div id="${uniqueId}" class="data-indent">
${items.join('\n')}
</div>
${indentStr}]`;
  }
  
  if (typeof data === 'object') {
    const uniqueId = `object_${Math.random().toString(36).substr(2, 9)}`;
    const entries = Object.entries(data);
    const keyCount = entries.length;
    
    if (keyCount === 0) {
      return `<span class="data-expandable" onclick="toggleExpand('${uniqueId}')">{}</span><span class="data-type-badge">object (empty)</span>`;
    }
    
    const formattedEntries = entries.map(([key, value]) => {
      const indentStr = '  '.repeat(indent + 1);
      return `${indentStr}<div class="data-object-key"><span class="data-key">"${escapeHtml(key)}":</span> ${formatDataForDisplay(value, indent + 1, `${path}.${key}`)}</div>`;
    });
    
    const indentStr = '  '.repeat(indent);
    return `<span class="data-expandable expanded" onclick="toggleExpand('${uniqueId}')">{</span><span class="data-type-badge">object (${keyCount})</span>
<div id="${uniqueId}" class="data-indent">
${formattedEntries.join('\n')}
</div>
${indentStr}}`;
  }
  
  return `<span class="data-value">${escapeHtml(String(data))}</span><span class="data-type-badge">unknown</span>`;
}

// 확장/축소 토글 함수
function toggleExpand(elementId) {
  const element = document.getElementById(elementId);
  const trigger = element.previousElementSibling;
  
  if (element.classList.contains('data-collapsed')) {
    element.classList.remove('data-collapsed');
    trigger.classList.add('expanded');
  } else {
    element.classList.add('data-collapsed');
    trigger.classList.remove('expanded');
  }
}

// 데이터 통계 생성
function generateDataStats(data) {
  let stats = {
    totalKeys: 0,
    dataTypes: {},
    depth: 0
  };
  
  function analyzeData(obj, currentDepth = 0) {
    stats.depth = Math.max(stats.depth, currentDepth);
    
    if (Array.isArray(obj)) {
      stats.dataTypes.array = (stats.dataTypes.array || 0) + 1;
      obj.forEach(item => analyzeData(item, currentDepth + 1));
    } else if (obj !== null && typeof obj === 'object') {
      const keys = Object.keys(obj);
      stats.totalKeys += keys.length;
      stats.dataTypes.object = (stats.dataTypes.object || 0) + 1;
      
      keys.forEach(key => {
        const value = obj[key];
        const type = Array.isArray(value) ? 'array' : typeof value;
        stats.dataTypes[type] = (stats.dataTypes[type] || 0) + 1;
        analyzeData(value, currentDepth + 1);
      });
    } else {
      const type = typeof obj;
      stats.dataTypes[type] = (stats.dataTypes[type] || 0) + 1;
    }
  }
  
  analyzeData(data);
  return stats;
}

// HTML 이스케이프
function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

// 로딩 표시기 제어
function showLoading(show) {
  const loading = document.getElementById('loadingIndicator');
  loading.style.display = show ? 'block' : 'none';
}


