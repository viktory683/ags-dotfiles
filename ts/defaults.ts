import App from 'resource:///com/github/Aylur/ags/app.js';

export const term_launch = 'alacritty -e';

export const sensors_icon = '';

export const battery_icons = '';
export const battery_charging_icon = '';

export const temperature_icons = '';
export const temperature_alert = '';
export const temperature_min = 45;
export const temperature_max = 75;

export const memory_icon = '';

export const cpu_icon = '';

export const backlight_icon = '';

export const network_icons = '';
export const network_disabled = '';

export const bluetooth_icon = '';
export const muted_icon = '';
export const silent_icon = '';
export const alert_icon = '';
export const volume_icons = '';
export const mic_icon = '';

export const player_icons = {
    play: '',
    stop: '',
    pause: '',
};

export const scratchpad_icon = '';

export const workspaceIcons = {
    '1': '',
    '2': '',
    '3': '',
    '4': '',
    '5': '',
    '6': '',
    '7': '',
    '8': '',
    '9': '',
    '10': '',
    '11': '',
    '12': '',
    default: '',
};

export const lang_alias = {
    'English (US)': '🇺🇸',
    Russian: '🇷🇺',
};

export const scss_path = `${App.configDir}/scss/style.scss`;
export const css_path = `${App.configDir}/style.css`;

// path to a file with temperature in millis
export const temp_path = '/sys/class/thermal/thermal_zone0/temp';
