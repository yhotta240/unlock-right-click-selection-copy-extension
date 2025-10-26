export interface Settings {
  rightClickEnabled: boolean;
  selectionEnabled: boolean;
  copyEnabled: boolean;
}

export const defaultSettings: Settings = {
  rightClickEnabled: true,
  selectionEnabled: true,
  copyEnabled: true,
};
