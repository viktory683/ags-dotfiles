import App from 'resource:///com/github/Aylur/ags/app.js';

const config = {
    // command to launch something in terminal
    term_launch: 'alacritty -e',

    battery: {
        icons: '',
        charging: '',
    },

    temperature: {
        icons: '',
        alert: '',
        min: 45,
        max: 75,
        path: '/sys/class/thermal/thermal_zone0/temp',
    },

    memory: {
        icon: '',
    },

    cpu: {
        icon: '',
    },

    brightness: {
        icon: '',
    },

    network: {
        icons: '',
        disabled: '',
        interface: 'wlan0',
    },

    volume: {
        icons: '',
        bluetooth: '',
        muted: '',
        silent: '',
        alert: '',
        mic: '',
    },

    player: {
        Playing: '',
        Paused: '',
        Stopped: '',
    },

    scratchpad: {
        icon: '',
    },

    workspaces: {
        icons: {
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
        },
    },

    language: {
        icons: {
            'English (US)': '🇺🇸',
            Russian: '🇷🇺',
        },
    },

    CSS: {
        paths: {
            scss: `${App.configDir}/scss/style.scss`,
            css: `${App.configDir}/style.css`,
        },
    },
};

export default config;
