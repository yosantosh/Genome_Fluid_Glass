import * as Main from 'resource:///org/gnome/shell/ui/main.js';
import * as PanelMenu from 'resource:///org/gnome/shell/ui/panelMenu.js';
import { Extension } from 'resource:///org/gnome/shell/extensions/extension.js';
import St from 'gi://St';
import Gio from 'gi://Gio';

// Genome Fluid Glass — one glass family for dock, QS, calendar, banners.
// CSS in stylesheet.css owns veil/rim/specular/shadow; this file owns the
// top-bar button, root style-classes and (next) the blur attach.
const QS_CLASS = 'fluid-glass-qs';
const MENU_CLASS = 'fluid-glass-menu';

class FluidGlassIndicator extends PanelMenu.Button {
    _init(ext) {
        super._init(0.0, 'Fluid Glass', false);
        this._ext = ext;
        this.add_style_class_name('genome-fluid-glass-button');

        const icon = new St.Icon({
            style_class: 'system-status-icon genome-fluid-glass-icon',
            gicon: this._loadIcon(ext),
            fallback_icon_name: 'preferences-desktop-theme-symbolic',
        });
        this.add_child(icon);

        // Direct to settings on click — no popup menu, like a launcher.
        this.connect('button-press-event', () => {
            try {
                this._ext.openPreferences();
            } catch {
                // Fallback for shells without Extension.openPreferences().
                try {
                    Gio.Subprocess.new(
                        ['gnome-extensions', 'prefs', this._ext.uuid],
                        Gio.SubprocessFlags.NONE);
                } catch { /* never trap the top bar */ }
            }
            return true;
        });
    }

    _loadIcon(ext) {
        try {
            const file = ext.dir.get_child('icons')
                .get_child('genome-fluid-glass-symbolic.svg');
            if (file.query_exists(null))
                return Gio.FileIcon.new(file);
        } catch { /* fall through to themed icon */ }
        return new Gio.ThemedIcon({ name: 'preferences-desktop-theme-symbolic' });
    }
}

export default class GenomeFluidGlassExtension extends Extension {
    _settings = null;
    _tracked = [];
    _indicator = null;
    _indicatorChangedId = 0;

    enable() {
        this._settings = this.getSettings();
        this._tagWhenOpen('quickSettings', QS_CLASS, 'enable-quick-settings-glass');
        this._tagWhenOpen('dateMenu', MENU_CLASS, 'enable-menu-glass');
        // Top-bar button, left of Wi-Fi/sound/battery (see _placeIndicator).
        this._syncIndicator();
        this._indicatorChangedId = this._settings.connect(
            'changed::show-indicator', () => this._syncIndicator());
        // TODO: attach Clutter blur clipped to container radius
        // (sigma/brightness/contrast/saturation from settings).
    }

    disable() {
        if (this._indicatorChangedId && this._settings) {
            try { this._settings.disconnect(this._indicatorChangedId); } catch { /* gone */ }
            this._indicatorChangedId = 0;
        }
        for (const [actor, cls] of this._tracked) {
            try { actor.remove_style_class_name(cls); } catch { /* already gone */ }
        }
        this._tracked = [];
        if (this._indicator) {
            try { this._indicator.destroy(); } catch { /* already gone */ }
            this._indicator = null;
        }
        this._settings = null;
    }

    _syncIndicator() {
        const show = this._settings?.get_boolean('show-indicator') ?? true;
        if (show && !this._indicator) {
            this._indicator = new FluidGlassIndicator(this);
            Main.panel.addToStatusArea(this.uuid, this._indicator, 0, 'right');
            this._placeLeftOfQuickSettings();
        } else if (!show && this._indicator) {
            try { this._indicator.destroy(); } catch { /* already gone */ }
            this._indicator = null;
        }
    }

    _placeLeftOfQuickSettings() {
        // addToStatusArea(…, 0, 'right') lands near the left of the right
        // box on stock GNOME, but Ubuntu's indicator order can differ, so
        // explicitly move just before the Quick Settings aggregate.
        try {
            const rightBox = Main.panel._rightBox;
            const qs = Main.panel.statusArea.quickSettings;
            const qsActor = qs?.container ?? qs?.actor ?? null;
            const myActor = this._indicator?.container ?? this._indicator?.actor ?? null;
            if (!rightBox || !qsActor || !myActor) return;
            const kids = rightBox.get_children();
            const qsIndex = kids.indexOf(qsActor);
            if (qsIndex < 0) return;
            rightBox.remove_child(myActor);
            rightBox.insert_child_at_index(myActor, qsIndex);
        } catch { /* private layout changed — order stays as inserted */ }
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
}
