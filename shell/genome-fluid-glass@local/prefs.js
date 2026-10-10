import { ExtensionPreferences } from 'resource:///org/gnome/Shell/Extensions/js/extensions/prefs.js';
import Adw from 'gi://Adw';
import Gtk from 'gi://Gtk';
import Gio from 'gi://Gio';

// Settings window for Genome Fluid Glass.
// Opens from the top-bar Fluid Glass icon (left of Wi-Fi/sound/battery).
export default class GenomeFluidGlassPreferences extends ExtensionPreferences {
    fillPreferencesWindow(window) {
        const settings = this.getSettings();
        window.set_default_size(620, 560);

        window.add(this._glassPage(settings));
        window.add(this._surfacesPage(settings));
        window.add(this._aboutPage());
    }

    _glassPage(settings) {
        const page = new Adw.PreferencesPage({ title: 'Glass', icon_name: 'preferences-desktop-theme-symbolic' });
        const blur = new Adw.PreferencesGroup({ title: 'Blur pipeline', description: 'Same engine for dock, QS, calendar, banners. Legibility wins over effect.' });
        blur.add(this._spin(settings, 'sigma', 'Blur sigma', 'Strong blur 30–40. Laggy? Drop to 24.', 20, 50, 1, 0));
        blur.add(this._spin(settings, 'brightness', 'Brightness', 'Slightly above 1 evens dark and bright wallpapers.', 0.8, 1.4, 0.01, 2));
        blur.add(this._spin(settings, 'contrast', 'Contrast', 'Keep near 1 so the veil stays neutral.', 0.8, 1.3, 0.01, 2));
        blur.add(this._spin(settings, 'saturation', 'Saturation', '1.3–1.5 keeps color alive without tinting.', 1.0, 2.5, 0.05, 2));
        page.add(blur);

        const shape = new Adw.PreferencesGroup({ title: 'Shape and veil', description: 'One radius family everywhere; hierarchy from spacing, never extra borders.' });
        shape.add(this._spin(settings, 'container-radius', 'Container radius', 'QS, calendar and banner share it (26–28).', 16, 32, 0.5, 1));
        shape.add(this._spin(settings, 'veil-alpha', 'Veil alpha', 'Dark veil, measured floor 0.65 for 4.5:1 on white. Lower only if you re-measure.', 0.2, 0.7, 0.01, 2));
        shape.add(this._spin(settings, 'rim-alpha', 'Rim alpha', 'Single 1px rim, 0.16–0.24.', 0.08, 0.4, 0.01, 2));
        // Accent is the system accent (Settings → Appearance); the theme
        // reads -st-accent-color / -st-accent-fg-color, no hardcoded hue.
        shape.add(new Adw.ActionRow({
            title: 'Accent: follows the system',
            subtitle: 'Change it in Settings → Appearance. Today circle, focus ring and ON toggles update live.',
        }));
        page.add(shape);
        return page;
    }

    _surfacesPage(settings) {
        const page = new Adw.PreferencesPage({ title: 'Surfaces', icon_name: 'view-grid-symbolic' });
        const top = new Adw.PreferencesGroup({ title: 'Top bar' });
        top.add(this._switch(settings, 'show-indicator', 'Show Fluid Glass button', 'Icon at top right, left of Wi-Fi/sound. Click opens these settings.'));
        page.add(top);

        const which = new Adw.PreferencesGroup({ title: 'Glass where?' });
        which.add(this._switch(settings, 'enable-dock-glass', 'Dock', 'Floating pill glass.'));
        which.add(this._switch(settings, 'enable-quick-settings-glass', 'Quick Settings', 'Same family as the dock.'));
        which.add(this._switch(settings, 'enable-menu-glass', 'Calendar / date menu', 'Includes the notification list inside it.'));
        which.add(this._switch(settings, 'enable-notification-glass', 'Banners and OSD', 'Toasts plus volume/brightness popups.'));
        which.add(this._switch(settings, 'enable-osd-glass', 'Extra OSD glass', 'Leave on unless it stutters.'));
        page.add(which);

        const compat = new Adw.PreferencesGroup({ title: 'Compatibility' });
        compat.add(this._switch(settings, 'frosted-fallback', 'Frosted fallback (no blur)', 'Honest CSS-only veil when the shader path is unavailable.'));
        page.add(compat);
        return page;
    }

    _aboutPage() {
        const page = new Adw.PreferencesPage({ title: 'About', icon_name: 'help-about-symbolic' });
        const group = new Adw.PreferencesGroup({ title: 'Genome Fluid Glass' });
        const row = new Adw.ActionRow({
            title: 'Clean, minimal, calm',
            subtitle: 'One glass family: dock, top bar, QS, calendar, banners, Nautilus.',
        });
        group.add(row);
        page.add(group);
        return page;
    }

    _switch(settings, key, title, subtitle) {
        const row = new Adw.SwitchRow({ title, subtitle });
        settings.bind(key, row, 'active', Gio.SettingsBindFlags.DEFAULT);
        return row;
    }

    _spin(settings, key, title, subtitle, lower, upper, step, digits) {
        const adj = new Gtk.Adjustment({ lower, upper, step_increment: step, page_increment: step * 10 });
        const row = new Adw.SpinRow({ title, subtitle, adjustment: adj, climb_rate: step, digits });
        settings.bind(key, row, 'value', Gio.SettingsBindFlags.DEFAULT);
        return row;
    }
}
