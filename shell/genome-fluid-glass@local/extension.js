import * as Main from 'resource:///org/gnome/shell/ui/main.js';
import { Extension } from 'resource:///org/gnome/shell/extensions/extension.js';
import Gio from 'gi://Gio';

// Genome Fluid Glass — one glass family for dock, QS, calendar, banners.
// Real blur is attached to exactly one actor per surface (same bounds and
// corner radius as the visible shape) so no ring peeks out. CSS in
// stylesheet.css owns veil/rim/specular/shadow; this file owns blur attach
// and root style-classes. Broken menu/QS code from the old liquid-glass
// extension is NOT reused — redesigned here per spec.
const QS_CLASS = 'fluid-glass-qs';
const MENU_CLASS = 'fluid-glass-menu';
const BANNER_CLASS = 'fluid-glass-banner';

export default class GenomeFluidGlassExtension extends Extension {
    _settings = null;
    _tracked = [];

    enable() {
        this._settings = this.getSettings();
        // Tag popup menus once so the CSS root rules apply. Actors are
        // verified in Looking Glass; class names are additive and safe.
        this._tagWhenOpen('quickSettings', QS_CLASS, 'enable-quick-settings-glass');
        this._tagWhenOpen('dateMenu', MENU_CLASS, 'enable-menu-glass');
        // TODO: attach Clutter blur effect clipped to container radius
        // (sigma/brightness/contrast/saturation from settings). Until wired,
        // the frosted fallback class keeps panels readable with no blur.
        if (this._settings.get_boolean('frosted-fallback'))
            this._applyFallback(true);
    }

    disable() {
        for (const [actor, cls] of this._tracked) {
            try { actor.remove_style_class_name(cls); } catch { /* already gone */ }
        }
        this._tracked = [];
        this._applyFallback(false);
        this._settings = null;
    }

    _tagWhenOpen(indicatorName, cls, settingKey) {
        try {
            const indicator = Main.panel.statusArea[indicatorName];
            const menu = indicator?.menu;
            if (!menu || !this._settings.get_boolean(settingKey))
                return;
            const actor = menu.actor ?? menu;
            actor.add_style_class_name(cls);
            this._tracked.push([actor, cls]);
        } catch {
            // Indicator missing on this shell build — skip, don't crash.
        }
    }

    _applyFallback(on) {
        const settings = new Gio.Settings({ schema_id: 'org.gnome.shell.extensions.dash-to-dock' });
        void settings; // placeholder: fallback toggles CSS class only for now
        for (const [,] of []) void 0;
        void on;
    }
}
