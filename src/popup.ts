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
      this.settings = data.settings || defaultSettings;

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
    this.rightClickEnabledElement.addEventListener('change', (event) => {
      this.settings.rightClickEnabled = (event.target as HTMLInputElement).checked;
      this.saveSettingsAndReload(
        this.settings.rightClickEnabled
          ? '右クリック制限解除が有効になりました'
          : '右クリック制限解除が無効になりました'
      );
    });

    this.selectionEnabledElement.addEventListener('change', (event) => {
      this.settings.selectionEnabled = (event.target as HTMLInputElement).checked;
      this.saveSettingsAndReload(
        this.settings.selectionEnabled
          ? '選択制限解除が有効になりました'
          : '選択制限解除が無効になりました'
      );
    });

    this.copyEnabledElement.addEventListener('change', (event) => {
      this.settings.copyEnabled = (event.target as HTMLInputElement).checked;
      this.saveSettingsAndReload(
        this.settings.copyEnabled
          ? 'コピー制限解除が有効になりました'
          : 'コピー制限解除が無効になりました'
      );
    });

    this.initializeUI();
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

    this.setupInfoTab();
  }

  private setupInfoTab(): void {
    const extensionLink = document.getElementById('extension_link') as HTMLAnchorElement;
    if (extensionLink) {
      extensionLink.href = `chrome://extensions/?id=${chrome.runtime.id}`;
      this.clickURL(extensionLink);
    }

    this.clickURL(document.getElementById('issue-link'));
    this.clickURL(document.getElementById('store_link'));

    const githubLink = document.getElementById('github-link') as HTMLAnchorElement;
    githubLink.href = this.manifestMetadata.github_url;
    githubLink.textContent = this.manifestMetadata.github_url;
    this.clickURL(githubLink);

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

  private clickURL(link: HTMLElement | string | null): void {
    if (!link) return;

    const url = (link instanceof HTMLElement && link.hasAttribute('href')) ? (link as HTMLAnchorElement).href : (typeof link === 'string' ? link : null);
    if (!url) return;

    if (link instanceof HTMLElement) {
      link.addEventListener('click', (event) => {
        event.preventDefault();
        chrome.tabs.create({ url });
      });
    }
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