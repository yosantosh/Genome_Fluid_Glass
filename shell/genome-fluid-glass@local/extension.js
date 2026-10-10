import * as Main from 'resource:///org/gnome/shell/ui/main.js';
import * as PanelMenu from 'resource:///org/gnome/shell/ui/panelMenu.js';
import { Extension } from 'resource:///org/gnome/shell/extensions/extension.js';
import St from 'gi://St';
import Gio from 'gi://Gio';

// Genome Fluid Glass — one glass family for dock, QS, calendar, banners.
// CSS owns veil/rim/specular/shadow; liquid-glass shader owns blur; this
// file owns the top-bar button, menu style-classes, the light-scheme switch
// and the frosted fallback. Disable path removes every class it added, so a
// GNOME update can never lock the session out.
const QS_CLASS = 'fluid-glass-qs';
const MENU_CLASS = 'fluid-glass-menu';
const LIGHT_CLASS = 'fluid-glass-light';
const FROSTED_CLASS = 'fluid-glass-frosted';

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
    _connections = [];
    _indicator = null;

    enable() {
        this._settings = this.getSettings();
        // Tag now (covers already-built menus) and re-tag on open, because
        // menu actors can be (re)created after enable on some shells.
        this._watchMenu('quickSettings', QS_CLASS, 'enable-quick-settings-glass');
        this._watchMenu('dateMenu', MENU_CLASS, 'enable-menu-glass');
        this._on('changed::enable-quick-settings-glass', () =>
            this._applyMenu('quickSettings', QS_CLASS, 'enable-quick-settings-glass'));
        this._on('changed::enable-menu-glass', () =>
            this._applyMenu('dateMenu', MENU_CLASS, 'enable-menu-glass'));
        this._on('changed::frosted-fallback', () => this._syncSchemeClasses());
        this._watchColorScheme();
        // Top-bar button, left of Wi-Fi/sound/battery (see _placeIndicator).
        this._syncIndicator();
        this._on('changed::show-indicator', () => this._syncIndicator());
    }

    disable() {
        for (const { obj, id } of this._connections) {
            try { obj.disconnect(id); } catch { /* already gone */ }
        }
        this._connections = [];
        for (const [actor, cls] of this._tracked) {
            try { actor.remove_style_class_name(cls); } catch { /* already gone */ }
        }
        this._tracked = [];
        if (this._indicator) {
            try { this._indicator.destroy(); } catch { /* already gone */ }
            this._indicator = null;
        }
        if (this._interfaceSettings) {
            // Gio.Settings needs no explicit dispose; drop the reference.
            this._interfaceSettings = null;
        }
        this._settings = null;
    }

    _on(signal, callback) {
        try {
            const id = this._settings.connect(signal, callback);
            this._connections.push({ obj: this._settings, id });
        } catch { /* setting missing — skip, don't crash */ }
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

    _menuActor(indicatorName) {
        try {
            const indicator = Main.panel.statusArea[indicatorName];
            const menu = indicator?.menu;
            if (!menu) return null;
            return menu.actor ?? menu;
        } catch {
            // Indicator missing on this shell build — skip, don't crash.
            return null;
        }
    }

    _addClass(actor, cls) {
        try {
            if (!actor.has_style_class_name(cls)) {
                actor.add_style_class_name(cls);
                this._tracked.push([actor, cls]);
            }
        } catch { /* actor gone */ }
    }

    _removeClass(actor, cls) {
        try { actor.remove_style_class_name(cls); } catch { /* already gone */ }
        this._tracked = this._tracked.filter(
            ([a, c]) => !(a === actor && c === cls));
    }

    _watchMenu(indicatorName, cls, settingKey) {
        this._applyMenu(indicatorName, cls, settingKey);
        // Re-apply on open: cheap, and covers actors built after enable.
        try {
            const menu = Main.panel.statusArea[indicatorName]?.menu;
            if (menu?.connect) {
                const id = menu.connect('open-state-changed', (_m, open) => {
                    if (open) this._applyMenu(indicatorName, cls, settingKey);
                });
                this._connections.push({ obj: menu, id });
            }
        } catch { /* no hookable menu — one-shot tag above stands */ }
    }

    _applyMenu(indicatorName, cls, settingKey) {
        const actor = this._menuActor(indicatorName);
        if (!actor) return;
        let on = true;
        try { on = this._settings.get_boolean(settingKey); } catch { /* default on */ }
        if (on) {
            this._addClass(actor, cls);
        } else {
            this._removeClass(actor, cls);
            this._removeClass(actor, LIGHT_CLASS);
            this._removeClass(actor, FROSTED_CLASS);
            return;
        }
        this._syncSchemeClasses();
    }

    _watchColorScheme() {
        // St.Settings mirrors the live shell scheme (verified pattern on
        // GNOME 42+); Gio fallback reads color-scheme directly.
        try {
            const stSettings = St.Settings.get();
            if (stSettings?.connect) {
                const id = stSettings.connect('notify::color-scheme', () =>
                    this._syncSchemeClasses());
                this._connections.push({ obj: stSettings, id });
            }
        } catch { /* St path unavailable — Gio below covers it */ }
        try {
            this._interfaceSettings = new Gio.Settings({
                schema_id: 'org.gnome.desktop.interface',
            });
            const id = this._interfaceSettings.connect('changed::color-scheme', () =>
                this._syncSchemeClasses());
            this._connections.push({ obj: this._interfaceSettings, id });
        } catch { /* last resort: classes stay as initially synced */ }
        this._syncSchemeClasses();
    }

    _isLightScheme() {
        try {
            const stSettings = St.Settings.get();
            const scheme = stSettings?.color_scheme;
            if (scheme !== undefined && St.ColorScheme !== undefined) {
                // DEFAULT counts as light (stock GNOME behaviour).
                return scheme !== St.ColorScheme.PREFER_DARK;
            }
        } catch { /* fall through to Gio */ }
        try {
            const v = (this._interfaceSettings ?? new Gio.Settings({
                schema_id: 'org.gnome.desktop.interface',
            })).get_string('color-scheme');
            return v !== 'prefer-dark';
        } catch {
            return false;
        }
    }

    _syncSchemeClasses() {
        let frosted = false;
        try { frosted = this._settings.get_boolean('frosted-fallback'); } catch { /* off */ }
        const light = this._isLightScheme();
        for (const indicatorName of ['quickSettings', 'dateMenu']) {
            const actor = this._menuActor(indicatorName);
            if (!actor) continue;
            if (light) this._addClass(actor, LIGHT_CLASS);
            else this._removeClass(actor, LIGHT_CLASS);
            if (frosted) this._addClass(actor, FROSTED_CLASS);
            else this._removeClass(actor, FROSTED_CLASS);
        }
    }
}
