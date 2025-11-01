export interface Settings {
  rightClickEnabled: boolean;
  selectionEnabled: boolean;
  copyEnabled: boolean;
  options: {
    customSites: CustomSiteSettings;
  };
}

interface CustomSiteSettings {
  [key: string]: {
    rightClick: boolean;
    selection: boolean;
    copy: boolean;
  };
}

export const defaultSettings: Settings = {
  rightClickEnabled: true,
  selectionEnabled: true,
  copyEnabled: true,
  options: {
    customSites: {}
  }
};
