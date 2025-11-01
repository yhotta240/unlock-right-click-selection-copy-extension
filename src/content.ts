import { Settings, defaultSettings } from './settings';

let currentSettings: Settings = defaultSettings;
let styleElement: HTMLStyleElement | null = null;
let observer: MutationObserver | null = null;
let isTemporarilyDisabled = false;

// 右クリック制限を解除する
function enableRightClick() {
  // contextmenuイベントのリスナーを追加
  document.addEventListener('contextmenu', (e) => {
    if (isTemporarilyDisabled && e.ctrlKey) {
      return; // Ctrl + 右クリックの場合は制限解除しない
    }
    e.stopPropagation();
  }, true);

  // dragstartイベントのリスナーを追加
  document.addEventListener('dragstart', (e) => {
    if (isTemporarilyDisabled) return;
    e.stopPropagation();
  }, true);

  // console.log('右クリック制限解除が有効化されました');
}

// コピー制限を解除する
function enableCopy() {
  // copyイベントのリスナーを追加
  document.addEventListener('copy', (e) => {
    if (isTemporarilyDisabled) return;
    e.stopPropagation();
  }, true);

  // cutイベントのリスナーを追加
  document.addEventListener('cut', (e) => {
    if (isTemporarilyDisabled) return;
    e.stopPropagation();
  }, true);

  // console.log('コピー制限解除が有効化されました');
}

// 選択制限を解除する
function enableSelection() {
  // selectstartイベントのリスナーを追加
  document.addEventListener('selectstart', (e) => {
    if (isTemporarilyDisabled) return;
    e.stopPropagation();
  }, true);

  // CSSによるuser-select制限を解除
  if (!styleElement) {
    styleElement = document.createElement('style');
    styleElement.textContent = `
      * {
        -webkit-user-select: text !important;
        -moz-user-select: text !important;
        -ms-user-select: text !important;
        user-select: text !important;
      }
    `;
    document.head.appendChild(styleElement);
  }

  // console.log('選択制限解除が有効化されました');
}

// インラインイベントハンドラを無効化
function removeInlineHandlers(element: Element) {
  const handlers = [];

  if (currentSettings.rightClickEnabled) {
    handlers.push('oncontextmenu', 'ondragstart');
  }

  if (currentSettings.selectionEnabled) {
    handlers.push('onselectstart');
  }

  if (currentSettings.copyEnabled) {
    handlers.push('oncopy', 'oncut');
  }

  handlers.forEach((attr) => {
    if (element.hasAttribute(attr)) {
      element.removeAttribute(attr);
    }
    // @ts-ignore
    if (element[attr]) {
      // @ts-ignore
      element[attr] = null;
    }
  });
}

// すべての既存要素のハンドラを削除
function removeAllInlineHandlers() {
  document.querySelectorAll('*').forEach((element) => {
    removeInlineHandlers(element);
  });
}

// 動的要素の監視を開始
function startObserver() {
  if (observer) {
    observer.disconnect();
  }

  observer = new MutationObserver((mutations) => {
    mutations.forEach((mutation) => {
      mutation.addedNodes.forEach((node) => {
        if (node.nodeType === Node.ELEMENT_NODE) {
          removeInlineHandlers(node as Element);
        }
      });
    });
  });

  observer.observe(document.documentElement, {
    childList: true,
    subtree: true
  });
}

// 機能を適用
function applySettings(settings: Settings) {
  currentSettings = settings;
  const customSites = settings?.options?.customSites || {};
  const hostname = window.location.hostname;

  // カスタムサイト設定が存在する場合は上書き
  if (customSites[hostname]) {
    const siteSettings = customSites[hostname];
    settings.rightClickEnabled = siteSettings.rightClick ?? settings.rightClickEnabled;
    settings.selectionEnabled = siteSettings.selection ?? settings.selectionEnabled;
    settings.copyEnabled = siteSettings.copy ?? settings.copyEnabled;
  }

  if (settings.rightClickEnabled) {
    enableRightClick();
  }

  if (settings.selectionEnabled) {
    enableSelection();
  }

  if (settings.copyEnabled) {
    enableCopy();
  }

  if (settings.rightClickEnabled || settings.selectionEnabled || settings.copyEnabled) {
    removeAllInlineHandlers();
    startObserver();
  } else {
    // すべて無効の場合は監視を停止
    if (observer) {
      observer.disconnect();
      observer = null;
    }
    // スタイルを削除
    if (styleElement && styleElement.parentNode) {
      styleElement.parentNode.removeChild(styleElement);
      styleElement = null;
    }
  }
}

// 設定を読み込んで適用
function loadAndApplySettings() {
  chrome.storage.local.get(['settings'], (data) => {
    const settings = data.settings || defaultSettings;
    applySettings(settings);
  });
}

// ページ読み込み時に実行
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', loadAndApplySettings);
} else {
  loadAndApplySettings();
}

// 設定変更を監視
chrome.storage.onChanged.addListener((changes, area) => {
  if (area === 'local' && changes.settings) {
    applySettings(changes.settings.newValue);
  }
});

// Ctrl + 左クリックで一時的に無効化
document.addEventListener('click', (e) => {
  if (e.ctrlKey) {
    isTemporarilyDisabled = !isTemporarilyDisabled;

    // スタイルの適用/削除
    if (isTemporarilyDisabled && styleElement && styleElement.parentNode) {
      styleElement.parentNode.removeChild(styleElement);
      styleElement = null;
    } else if (!isTemporarilyDisabled && currentSettings.selectionEnabled && !styleElement) {
      styleElement = document.createElement('style');
      styleElement.textContent = `
        * {
          -webkit-user-select: text !important;
          -moz-user-select: text !important;
          -ms-user-select: text !important;
          user-select: text !important;
        }
      `;
      document.head.appendChild(styleElement);
    }

    // console.log(isTemporarilyDisabled ? '機能を一時的に無効化しました' : '機能を再度有効化しました');
  }
}, true);
