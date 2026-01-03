// Chrome拡張機能のアイコンがクリックされたときにサイドパネルを開く
chrome.action.onClicked.addListener((tab) => {
  chrome.sidePanel.open({ tabId: tab.id });
});

// サイドパネルからのメッセージを処理
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'getCurrentTabUrl') {
    getCurrentTabUrl().then(sendResponse);
    return true; // 非同期レスポンスを示す
  }
});

// 現在のアクティブタブのURLを取得
async function getCurrentTabUrl() {
  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (tab && tab.url) {
      return { url: tab.url };
    }
    return { error: 'No active tab found' };
  } catch (error) {
    console.error('Error getting current tab:', error);
    return { error: error.message };
  }
}

// 拡張機能インストール時の処理
chrome.runtime.onInstalled.addListener(() => {
  console.log('Jira Project Viewer extension installed');
});
