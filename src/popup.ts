import 'bootstrap/dist/css/bootstrap.min.css';
import 'bootstrap/dist/js/bootstrap.bundle.min.js';
import 'bootstrap-icons/font/bootstrap-icons.css';
import { PopupPanel } from './components/popup-panel';
import { defaultSettings } from './settings';
import meta from '../public/manifest.meta.json';

class PopupManager {
  private panel: PopupPanel;
  private settings = defaultSettings;
  private rightClickEnabledElement: HTMLInputElement;
  private selectionEnabledElement: HTMLInputElement;
  private copyEnabledElement: HTMLInputElement;
  private manifestData: chrome.runtime.Manifest;
  private manifestMetadata: { [key: string]: any } = (meta as any) || {};

  constructor() {
    this.panel = new PopupPanel();
    this.rightClickEnabledElement = document.getElementById('right-click-enabled') as HTMLInputElement;
    this.selectionEnabledElement = document.getElementById('selection-enabled') as HTMLInputElement;
    this.copyEnabledElement = document.getElementById('copy-enabled') as HTMLInputElement;
    this.manifestData = chrome.runtime.getManifest();
    this.manifestMetadata = (meta as any) || {};

    this.loadInitialState();
    this.addEventListeners();
  }

  private loadInitialState(): void {
    chrome.storage.local.get(['settings'], (data) => {
      this.settings = data.settings ?? defaultSettings;

      this.rightClickEnabledElement.checked = this.settings.rightClickEnabled;
      this.selectionEnabledElement.checked = this.settings.selectionEnabled;
      this.copyEnabledElement.checked = this.settings.copyEnabled;

      const messages = [];
      if (this.settings.rightClickEnabled) messages.push('右クリック制限解除');
      if (this.settings.selectionEnabled) messages.push('選択制限解除');
      if (this.settings.copyEnabled) messages.push('コピー制限解除');

      this.showMessage(
        messages.length > 0
          ? `${messages.join('，')}が有効です`
          : 'すべての機能が無効です'
      );
    });
  }

  private addEventListeners(): void {
    this.addSettingChangeListener(this.rightClickEnabledElement, 'rightClickEnabled', '右クリック制限解除');
    this.addSettingChangeListener(this.selectionEnabledElement, 'selectionEnabled', '選択制限解除');
    this.addSettingChangeListener(this.copyEnabledElement, 'copyEnabled', 'コピー制限解除');

    this.initializeUI();
  }

  private addSettingChangeListener(element: HTMLInputElement, settingKey: keyof typeof this.settings, featureName: string): void {
    element.addEventListener('change', (event) => {
      const isChecked = (event.target as HTMLInputElement).checked;
      (this.settings as any)[settingKey] = isChecked;
      this.saveSettingsAndReload(
        isChecked ? `${featureName}が有効になりました` : `${featureName}が無効になりました`
      );
    });
  }

  private saveSettingsAndReload(message: string): void {
    chrome.storage.local.set({ settings: this.settings }, () => {
      this.showMessage(message);

      chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        if (tabs[0]?.id) {
          chrome.tabs.reload(tabs[0].id);
        }
      });
    });
  }

  private initializeUI(): void {
    const title = document.getElementById('title');
    if (title) {
      title.textContent = this.manifestData.name;
    }
    const titleHeader = document.getElementById('title-header');
    if (titleHeader) {
      const shortName = this.manifestData.short_name || this.manifestData.name;
      titleHeader.textContent = shortName;
    }

    const newTabButton = document.getElementById('new-tab-button');
    if (newTabButton) {
      newTabButton.addEventListener('click', () => {
        chrome.tabs.create({ url: 'popup.html' });
      });
    }

    this.setupCustomSites();
    this.setupInfoTab();
  }

  private setupCustomSites(): void {
    const siteInput = document.getElementById('site-input') as HTMLInputElement;
    const addSiteButton = document.getElementById('add-site-button') as HTMLButtonElement;

    const loadCustomSiteList = (): void => {
      chrome.storage.local.get(['settings'], (data) => {
        const customSites = data.settings?.options?.customSites || {};
        const customSiteList = document.getElementById('custom-site-list') as HTMLUListElement;
        customSiteList.innerHTML = '';

        Object.keys(customSites).forEach(siteUrl => {
          const siteSettings = customSites[siteUrl];
          createSiteListItem(siteUrl, siteSettings);
        });
      });
    }

    const addCustomSite = (hostname: string): void => {
      chrome.storage.local.get(['settings'], (data) => {
        const customSites = data.settings?.options?.customSites || {};

        // もし既に存在する場合は追加しない
        if (customSites[hostname]) {
          this.showMessage(`${hostname} は既にカスタムサイトに登録されています`);
          return;
        }

        // デフォルト設定
        customSites[hostname] = { rightClick: false, selection: false, copy: false };

        chrome.storage.local.set({ settings: data.settings }, () => {
          createSiteListItem(hostname, customSites[hostname]);
          this.showMessage(`${hostname} をカスタムサイトに追加しました`);
        });
      });
    }

    const createSiteListItem = (hostname: string, settings: any): void => {
      const customSiteList = document.getElementById('custom-site-list') as HTMLUListElement;

      const listItem = document.createElement('div');
      listItem.className = 'list-group-item d-flex justify-content-between align-items-center pe-1';
      listItem.title = hostname;

      listItem.innerHTML = `
        <div class="d-flex align-items-center text-truncate me-3 min-w-0">
          <img src="https://www.google.com/s2/favicons?sz=64&domain=${hostname}" alt="アイコン" class="me-2" style="width:16px; height:16px;">
          <span class="text-truncate">${hostname}</span>
        </div>
        <div class="d-flex align-items-center gap-3">
          <div class="form-check" title="右クリック制限解除">
            <i class="bi bi-mouse"></i>
            <input class="form-check-input" type="checkbox" data-setting="rightClick" ${settings.rightClick ? 'checked' : ''} style="height: 16px; width: 16px;">
          </div>
          <div class="form-check" title="選択制限解除">
            <i class="bi bi-textarea-t"></i>
            <input class="form-check-input" type="checkbox" data-setting="selection" ${settings.selection ? 'checked' : ''} style="height: 16px; width: 16px;">
          </div>
          <div class="form-check" title="コピー制限解除">
            <i class="bi bi-clipboard-plus"></i>
            <input class="form-check-input" type="checkbox" data-setting="copy" ${settings.copy ? 'checked' : ''} style="height: 16px; width: 16px;">
          </div>
          <button type="button" class="btn-close" aria-label="削除" title="この設定を削除"></button>
        </div>
      `;

      // チェックボックスのイベントリスナーを追加
      const checkboxes = listItem.querySelectorAll('input[type="checkbox"]');
      checkboxes.forEach(checkbox => {
        checkbox.addEventListener('change', (event) => {
          const target = event.target as HTMLInputElement;
          const settingKey = target.getAttribute('data-setting');
          updateCustomSiteSetting(hostname, settingKey!, target.checked);
        });
      });

      // 削除ボタンのイベントリスナーを追加
      const deleteButton = listItem.querySelector('.btn-close');
      deleteButton?.addEventListener('click', () => {
        removeCustomSite(hostname, listItem);
      });

      customSiteList.appendChild(listItem);
    }

    const updateCustomSiteSetting = (hostname: string, settingKey: string, isEnabled: boolean): void => {
      chrome.storage.local.get(['settings'], (data) => {
        const customSites = data.settings?.options?.customSites || {};

        if (customSites[hostname]) {
          customSites[hostname][settingKey] = isEnabled;

          chrome.storage.local.set({ settings: data.settings }, () => {
            const featureName = settingKey === 'rightClick' ? '右クリック制限解除' :
              settingKey === 'selection' ? '選択制限解除' : 'コピー制限解除';
            this.showMessage(`${hostname}: ${featureName}が${isEnabled ? '有効' : '無効'}になりました`);
          });
        }
      });
    }

    const removeCustomSite = (siteUrl: string, listItem: HTMLElement): void => {
      chrome.storage.local.get(['settings'], (data) => {
        const customSites = data.settings?.options?.customSites || {};

        delete customSites[siteUrl];

        chrome.storage.local.set({ settings: data.settings }, () => {
          listItem.remove();
          this.showMessage(`${siteUrl} をカスタムサイトから削除しました`);
        });
      });
    }

    // 初期ロード時にカスタムサイト一覧を表示
    loadCustomSiteList();

    addSiteButton.addEventListener('click', () => {
      const siteUrl = siteInput.value.trim();
      try {
        const hostname = new URL(siteUrl).hostname;

        if (siteUrl && hostname) {
          addCustomSite(hostname);
          siteInput.value = '';
        }
      } catch (error) {
        this.showMessage('有効なURLを入力してください');
      }
    });
  }

  private setupInfoTab(): void {
    const storeLink = document.getElementById('store_link') as HTMLAnchorElement;
    if (storeLink) {
      storeLink.href = `https://chrome.google.com/webstore/detail/${chrome.runtime.id}`;
      this.addTabCreateListener(storeLink);
    }

    const extensionLink = document.getElementById('extension_link') as HTMLAnchorElement;
    if (extensionLink) {
      extensionLink.href = `chrome://extensions/?id=${chrome.runtime.id}`;
      this.addTabCreateListener(extensionLink);
    }

    this.addTabCreateListener(document.getElementById('issue-link') as HTMLAnchorElement);

    const githubLink = document.getElementById('github-link') as HTMLAnchorElement;
    githubLink.href = this.manifestMetadata.github_url;
    githubLink.textContent = this.manifestMetadata.github_url;
    this.addTabCreateListener(githubLink);

    const extensionId = document.getElementById('extension-id');
    if (extensionId) {
      extensionId.textContent = chrome.runtime.id;
    }
    const extensionName = document.getElementById('extension-name');
    if (extensionName) {
      extensionName.textContent = this.manifestData.name;
    }
    const extensionVersion = document.getElementById('extension-version');
    if (extensionVersion) {
      extensionVersion.textContent = this.manifestData.version;
    }
    const extensionDescription = document.getElementById('extension-description');
    if (extensionDescription) {
      extensionDescription.textContent = this.manifestData.description ?? '';
    }

    chrome.permissions.getAll((result) => {
      const permissionInfo = document.getElementById('permission-info');
      const permissions = result.permissions;
      if (permissionInfo && permissions) {
        permissionInfo.textContent = permissions.join(', ');
      }

      let siteAccess: string = '';
      if (result.origins && result.origins.length > 0) {
        if (result.origins.includes("<all_urls>")) {
          siteAccess = "すべてのサイト";
        } else {
          siteAccess = result.origins.join("<br>");
        }
      } else {
        siteAccess = "クリックされた場合のみ";
      }
      const siteAccessElement = document.getElementById('site-access');
      if (siteAccessElement) {
        siteAccessElement.innerHTML = siteAccess;
      }
    });

    chrome.extension.isAllowedIncognitoAccess((isAllowedAccess) => {
      const incognitoEnabled = document.getElementById('incognito-enabled');
      if (incognitoEnabled) {
        incognitoEnabled.textContent = isAllowedAccess ? '有効' : '無効';
      }
    });

    const publisherName = document.getElementById('publisher-name') as HTMLElement;
    const publisher = this.manifestMetadata.publisher || '不明';
    publisherName.textContent = publisher;

    const developerName = document.getElementById('developer-name') as HTMLElement;
    const developer = this.manifestMetadata.developer || '不明';
    developerName.textContent = developer;
  }

  private addTabCreateListener(link: HTMLAnchorElement | null): void {
    if (!link) return;

    link.addEventListener('click', (event) => {
      event.preventDefault();
      const url = link.href;
      if (url) chrome.tabs.create({ url });
    });
  }

  private showMessage(message: string, timestamp: string = this.dateTime()) {
    this.panel.messageOutput(message, timestamp);
  }

  private dateTime(): string {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    return `${year}-${month}-${day} ${hours}:${minutes}`;
  }
}

document.addEventListener('DOMContentLoaded', () => new PopupManager());