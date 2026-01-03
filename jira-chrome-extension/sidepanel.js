// DOM要素
const baseUrlInput = document.getElementById('baseUrl');
const refreshUrlBtn = document.getElementById('refreshUrl');
const fetchProjectsBtn = document.getElementById('fetchProjects');
const statusDiv = document.getElementById('status');
const projectListDiv = document.getElementById('projectList');

// 状態管理
let currentBaseUrl = '';

// 初期化
document.addEventListener('DOMContentLoaded', async () => {
  await loadSavedBaseUrl();
  await updateBaseUrlFromCurrentTab();
});

// 保存されたBase URLを読み込む
async function loadSavedBaseUrl() {
  try {
    const result = await chrome.storage.local.get(['jiraBaseUrl']);
    if (result.jiraBaseUrl) {
      currentBaseUrl = result.jiraBaseUrl;
      baseUrlInput.value = currentBaseUrl;
    }
  } catch (error) {
    console.error('Failed to load saved base URL:', error);
  }
}

// 現在のタブからBase URLを取得
async function updateBaseUrlFromCurrentTab() {
  try {
    const response = await chrome.runtime.sendMessage({ action: 'getCurrentTabUrl' });
    if (response && response.url) {
      const url = new URL(response.url);
      // Atlassian/Jiraのドメインかチェック
      if (url.hostname.includes('atlassian.net') || url.hostname.includes('jira')) {
        currentBaseUrl = `${url.protocol}//${url.hostname}`;
        baseUrlInput.value = currentBaseUrl;
        await saveBaseUrl(currentBaseUrl);
        showStatus('URLを検出しました', 'success');
      } else {
        showStatus('Jiraページで開いてください', 'error');
      }
    }
  } catch (error) {
    console.error('Failed to get current tab URL:', error);
    showStatus('URLの取得に失敗しました', 'error');
  }
}

// Base URLを保存
async function saveBaseUrl(url) {
  try {
    await chrome.storage.local.set({ jiraBaseUrl: url });
  } catch (error) {
    console.error('Failed to save base URL:', error);
  }
}

// ステータス表示
function showStatus(message, type = 'loading') {
  statusDiv.textContent = message;
  statusDiv.className = `status show ${type}`;

  if (type !== 'loading') {
    setTimeout(() => {
      statusDiv.className = 'status';
    }, 3000);
  }
}

// プロジェクト一覧を取得
async function fetchProjects() {
  if (!currentBaseUrl) {
    showStatus('Base URLが設定されていません', 'error');
    return;
  }

  fetchProjectsBtn.disabled = true;
  fetchProjectsBtn.innerHTML = '<span class="loading-spinner"></span> 取得中...';
  showStatus('プロジェクトを取得中...', 'loading');

  try {
    // Jira REST API v3でプロジェクト一覧を取得
    const apiUrl = `${currentBaseUrl}/rest/api/3/project/search`;

    const response = await fetch(apiUrl, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      },
      credentials: 'include' // Jiraにログイン済みの認証情報を使用
    });

    if (!response.ok) {
      if (response.status === 401) {
        throw new Error('認証が必要です。Jiraにログインしてください。');
      } else if (response.status === 403) {
        throw new Error('アクセス権限がありません。');
      } else {
        throw new Error(`APIエラー: ${response.status}`);
      }
    }

    const data = await response.json();
    displayProjects(data.values || data);
    showStatus(`${(data.values || data).length}件のプロジェクトを取得しました`, 'success');

  } catch (error) {
    console.error('Failed to fetch projects:', error);
    showStatus(error.message || 'プロジェクトの取得に失敗しました', 'error');
    projectListDiv.innerHTML = `<div class="error-message">${error.message}</div>`;
  } finally {
    fetchProjectsBtn.disabled = false;
    fetchProjectsBtn.innerHTML = '📋 プロジェクト一覧を取得';
  }
}

// プロジェクト一覧を表示
function displayProjects(projects) {
  if (!projects || projects.length === 0) {
    projectListDiv.innerHTML = '<div class="no-projects">プロジェクトが見つかりませんでした</div>';
    return;
  }

  const projectsHtml = projects.map(project => {
    const avatarContent = project.avatarUrls && project.avatarUrls['32x32']
      ? `<img src="${project.avatarUrls['32x32']}" alt="${project.key}">`
      : project.key.substring(0, 2).toUpperCase();

    return `
      <div class="project-item">
        <div class="project-avatar">
          ${typeof avatarContent === 'string' && avatarContent.startsWith('<img') ? avatarContent : avatarContent}
        </div>
        <div class="project-info">
          <div class="project-name">${escapeHtml(project.name)}</div>
          <div class="project-key">${escapeHtml(project.key)}</div>
        </div>
        <a href="${currentBaseUrl}/browse/${project.key}"
           target="_blank"
           class="project-link"
           title="プロジェクトを開く">
          開く →
        </a>
      </div>
    `;
  }).join('');

  projectListDiv.innerHTML = projectsHtml;
}

// HTMLエスケープ
function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

// イベントリスナー
refreshUrlBtn.addEventListener('click', updateBaseUrlFromCurrentTab);
fetchProjectsBtn.addEventListener('click', fetchProjects);
