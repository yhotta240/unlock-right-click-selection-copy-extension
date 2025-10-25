import 'bootstrap/dist/css/bootstrap.min.css';
import 'bootstrap/dist/js/bootstrap.bundle.min.js';
import { PopupPanel } from './components/popup-panel';

class PopupManager {
  private panel: PopupPanel;
  private isEnabled: boolean = false;
  private enabledElement: HTMLInputElement | null;
  private manifestData: chrome.runtime.Manifest;

  constructor() {
    this.panel = new PopupPanel();
    this.enabledElement = document.getElementById('enabled') as HTMLInputElement;
    this.manifestData = chrome.runtime.getManifest();

    this.loadInitialState();
    this.addEventListeners();
  }

  private loadInitialState(): void {
    chrome.storage.local.get(['settings', 'isEnabled'], (data) => {
      if (this.enabledElement) {
        this.isEnabled = data.isEnabled || false;
        this.enabledElement.checked = this.isEnabled;
      }
      this.showMessage(this.isEnabled ? `${this.manifestData.name} は有効になっています` : `${this.manifestData.name} は無効になっています`);
    });
  }

  private addEventListeners(): void {
    if (this.enabledElement) {
      this.enabledElement.addEventListener('change', (event) => {
        this.isEnabled = (event.target as HTMLInputElement).checked;
        chrome.storage.local.set({ isEnabled: this.isEnabled }, () => {
          this.showMessage(this.isEnabled ? `${this.manifestData.name} は有効になっています` : `${this.manifestData.name} は無効になっています`);
        });
      });
    }

    document.addEventListener('DOMContentLoaded', () => {
      this.initializeUI();
    });
  }

  private initializeUI(): void {
    const title = document.getElementById('title');
    if (title) {
      title.textContent = this.manifestData.name;
    }
    const titleHeader = document.getElementById('title-header');
    if (titleHeader) {
      titleHeader.textContent = this.manifestData.name;
    }
    const enabledLabel = document.getElementById('enabled-label');
    if (enabledLabel) {
      enabledLabel.textContent = `${this.manifestData.name} を有効にする`;
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
    this.clickURL(document.getElementById('github-link'));

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
  }

  private saveSettings(datetime: string, message: string, value: any): void {
    const settings = {
      sampleValue: value,
    };
    chrome.storage.local.set({ settings: settings }, () => {
      this.showMessage(message, datetime);
    });
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

new PopupManager();