import { ExtensionPreferences } from 'resource:///org/gnome/Shell/Extensions/js/extensions/prefs.js';

// Minimal prefs stub — full tunable UI (sigma, veil, rim, accent) lands
// once the blur pipeline is wired. Settings are editable now via dconf:
//   dconf dump /org/gnome/shell/extensions/genome-fluid-glass/
export default class GenomeFluidGlassPreferences extends ExtensionPreferences {
    fillPreferencesWindow() {
        // TODO: build Adw pages bound to the gschema keys.
    }
}
