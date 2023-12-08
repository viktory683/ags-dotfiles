// importing 
// // @ts-ignore
// import Hyprland from 'resource:///com/github/Aylur/ags/service/hyprland.js';
// @ts-ignore
import Notifications from 'resource:///com/github/Aylur/ags/service/notifications.js';
// @ts-ignore
import Mpris from 'resource:///com/github/Aylur/ags/service/mpris.js';
// @ts-ignore
import Audio from 'resource:///com/github/Aylur/ags/service/audio.js';
// @ts-ignore
import Battery from 'resource:///com/github/Aylur/ags/service/battery.js';
// @ts-ignore
import SystemTray from 'resource:///com/github/Aylur/ags/service/systemtray.js';
// @ts-ignore
import App from 'resource:///com/github/Aylur/ags/app.js';
// @ts-ignore
import Widget from 'resource:///com/github/Aylur/ags/widget.js';
// @ts-ignore
import { subprocess, exec, execAsync } from 'resource:///com/github/Aylur/ags/utils.js';
// @ts-ignore
import Variable from 'resource:///com/github/Aylur/ags/variable.js';

// import moment from 'moment';
// import { moment as mmm } from "../ags/node_modules/moment/moment.js";
// import moment, * as exports from 'moment';
// console.log(moment);

console.log(App.configDir)

// TODO here should be some checks
// for example if sacss and inotifywait exists in system

function reloadCss() {
    const scss = App.configDir + '/scss/style.scss';
    const css = App.configDir + '/style.css';

    exec(`sassc ${scss} ${css}`);
    console.log('CSS UPDATED');

    return css;
}

reloadCss();
// CSS autoreload
subprocess([
    'inotifywait',
    '--recursive',
    '--event', 'create,modify',
    '-m', App.configDir + '/scss'
], () => {
    let f = reloadCss();
    App.resetCss();
    App.applyCss(f);
});

// workspaces
// scratchpad
// media?
// - - -
// time date combined with notification window
// - - -
// tray (maybe do it like in windows, like open small popup with all stuff)
// some sensors (temperature, memory, cpu)
// sound
// network
// power (shows battery icon but opens sub window on click) (the same window should be opened on Win+Esc)
//     - reboot/sleep/lock/exit/poweroff

const swayWorkspaces = Variable([], {
    listen: [
        App.configDir + '/scripts/workspaces_listener',
        out => JSON.parse(out)
    ]
});

const swayScratchpad = Variable(0, {
    listen: [
        App.configDir + '/scripts/scratchpad_listener',
        out => parseInt(out)
    ]
});

const workspaceIcons = {
    "1": "",
    "2": "",
    "3": "",
    "4": "",
    "5": "",
    "6": "",
    "7": "",
    "8": "",
    "9": "",
    "10": "",
    "11": "",
    "12": "",
    "default": ""
};

function Workspaces() {
    function Scratchpad() {

        let label_text = '';
        if (swayScratchpad.value != 0) {
            label_text = ` ${swayScratchpad.value}`;
        }
        return Widget.Button({
            onPrimaryClick: () => execAsync('swaymsg scratchpad show'),
            onSecondaryClick: () => execAsync('swaymsg move scratchpad'),
            child: Widget.Label({
                label: `${label_text}`
            })
        })
    }

    function update(obj) {
        obj.children = swayWorkspaces.value.map(
            (w) => Widget.Button({
                onClicked: () => execAsync(`swaymsg workspace ${w.name}`),
                child: Widget.Label({
                    label: workspaceIcons[w.name] || workspaceIcons["default"]
                }),

                cursor: "pointer",
                className: `${w.focused ? 'focused' : ''} ${w.visible ? 'visible' : ''} ${w.urgent ? 'urgent' : ''}`,
            })
        ).concat(Scratchpad());
    }

    return Widget.Box({
        className: 'workspaces',
        connections: [
            [swayWorkspaces, self => update(self)],
            [swayScratchpad, self => update(self)]
        ],
    });
}

const swayMode = Variable('default', {
    listen: [
        App.configDir + '/scripts/mode_listener',
        out => JSON.parse(out).name
    ]
});

function Mode() {
    return Widget.Revealer({
        revealChild: false,
        transitionDuration: 500,
        transition: 'slide_right',
        child: Widget.Button({
            onClicked: () => execAsync(`swaymsg mode default`),
            cursor: "pointer",
            child: Widget.Label({
                label: "MODE"
            })
        }),
        connections: [[swayMode, self => {
            let mode = swayMode.value;

            if (mode != "default") {
                self.child.child.label = mode;
            }
            self.revealChild = !self.revealChild;
        }]],
    })
}

function Clock() {
    return Widget.Label({
        className: 'clock',
        connections: [[
            1000,
            // self => execAsync(['date', '+%I:%M:%S'])
            //     .then(date => self.label = date)
            //     .catch(console.error)
            self => {
                // self.label = `${moment().format('dddd')}`
                self.label = `${Date()}`
            }
        ]],
    });
}

const language = Variable("default", {
    listen: [
        App.configDir + '/scripts/language_listener',
        out => JSON.parse(out).lang
    ]
})

const language_alias = {
    "English (US)": "🇺🇸",
    "Russian": "🇷🇺"
}

function Language() {
    return Widget.Button({
        onClicked: () => execAsync(`swaymsg input type:keyboard xkb_switch_layout next`),
        child: Widget.Label({
            // label: language_alias[language.value] || language.value,
            connections: [[
                language, self => {
                    self.label = language_alias[language.value] || language.value
                }
            ]]
        })
    })
}

// we don't need dunst or any other notification daemon
// because the Notifications module is a notification daemon itself
function Notification() {
    return Widget.Box({
        className: 'notification',
        children: [
            Widget.Icon({
                icon: 'preferences-system-notifications-symbolic',
                connections: [[
                    Notifications,
                    self => self.visible = Notifications.popups.length > 0
                ]],
            }),
            Widget.Label({
                connections: [[
                    Notifications,
                    self => {
                        self.label = Notifications.popups[0]?.summary || '';
                    }
                ]],
            }),
        ],
    });
}

function Media() {
    return Widget.Button({
        className: 'media',
        onPrimaryClick: () => Mpris.getPlayer('')?.playPause(),
        onScrollUp: () => Mpris.getPlayer('')?.next(),
        onScrollDown: () => Mpris.getPlayer('')?.previous(),
        child: Widget.Label({
            connections: [[
                Mpris,
                self => {
                    const mpris = Mpris.getPlayer('');
                    let status = Mpris.playBackStatus;

                    let statusIcon;
                    // console.log(status);
                    switch (status) {
                        case "Playing":
                            statusIcon = '';
                            break;
                        case "Paused":
                            statusIcon = '';
                            break;
                        case "Stopped":
                            statusIcon = '';
                            break;
                        default:
                            statusIcon = '?';
                    }

                    // mpris player can be undefined
                    if (mpris)
                        self.label = `${statusIcon} ${mpris.trackArtists.join(', ')} - ${mpris.trackTitle}`;
                    else
                        self.label = 'Nothing is playing';
                }
            ]],
        }),
    });
}

function Volume() {
    return Widget.Button({
        onClicked: () => Audio.speaker.stream.isMuted = !Audio.speaker.stream.isMuted,
        child: Widget.Box({
            spacing: 8,
            children: [
                Widget.Label({
                    connections: [[Audio, self => {
                        self.label = Audio.speaker?.stream.isMuted ? '' : ` ${Math.floor((Audio.speaker?.volume || 0) * 100)}`
                    }]],
                    label: `undefined`
                }),
                Widget.Label({
                    connections: [[Audio, self => {
                        self.visible = !Audio.microphone?.stream.isMuted
                    }]],
                    label: "",
                }),
            ]
        })
        // children : 
    })
}



function _Volume() {
    return Widget.Box({
        className: 'volume',
        // css: 'min-width: 90px; ',
        children: [
            Widget.Stack({
                items: [
                    // tuples of [string, Widget]
                    ['101', Widget.Icon('audio-volume-overamplified-symbolic')],
                    ['67', Widget.Icon('audio-volume-high-symbolic')],
                    ['34', Widget.Icon('audio-volume-medium-symbolic')],
                    ['1', Widget.Icon('audio-volume-low-symbolic')],
                    ['0', Widget.Icon('audio-volume-muted-symbolic')],
                ],
                connections: [[
                    Audio,
                    self => {
                        if (!Audio.speaker)
                            return;

                        if (Audio.speaker.isMuted) {
                            self.shown = '0';
                            return;
                        }

                        const show = [101, 67, 34, 1, 0].find(threshold => threshold <= Audio.speaker.volume * 100);

                        self.shown = `${show}`;
                    }, 'speaker-changed'
                ]],
            }),
            Widget.ProgressBar({
                vertical: true,
                // vpack: "center",
                value: 0.5,
            }),
            Widget.Slider({
                hexpand: true,
                drawValue: false,
                onChange: ({ value }) => Audio.speaker.volume = value,
                connections: [[
                    Audio,
                    self => {
                        self.value = Audio.speaker?.volume || 0;
                    },
                    'speaker-changed'
                ]],
            }),
        ],
    });
}

const BatteryLabel = () => Widget.Box({
    className: 'battery',
    children: [
        Widget.Icon({
            connections: [[Battery, self => {
                self.icon = `battery-level-${Math.floor(Battery.percent / 10) * 10}-symbolic`;
            }]]
        }),
        Widget.ProgressBar({
            vpack: 'center',
            connections: [[Battery, self => {
                if (Battery.percent < 0)
                    return;

                self.fraction = Battery.percent / 100;
            }]],
        }),
    ],
});

const SysTray = () => Widget.Box({
    connections: [[
        SystemTray,
        self => {
            self.children = SystemTray.items.map(item => Widget.Button({
                child: Widget.Icon({
                    binds: [[
                        'icon',
                        item,
                        'icon']
                    ]
                }),
                onPrimaryClick: (_, event) => item.activate(event),
                onSecondaryClick: (_, event) => item.openMenu(event),
                binds: [[
                    'tooltip-markup',
                    item,
                    'tooltip-markup'
                ]],
            }));
        }]],
});

function GetFuck() {
    let w = Widget.Button({
        visible: true,
        child: Widget.Label({
            label: "FUCK",
        })
    });
    console.log(w.visible);
    return w;
}

// layout of the bar
const Left = () => Widget.Box({
    children: [
        Workspaces(),
        Mode(),
        // ClientTitle(),
        Media(),
        GetFuck(),
    ],
});

const Center = () => Widget.Box({
    children: [
        Notification(),
        Clock(),
    ],
});

const Right = () => Widget.Box({
    hpack: 'end',
    children: [
        Language(),
        SysTray(),
        Volume(),
        // BatteryLabel(),
    ],
});

function Bar(monitor = 0) {
    return Widget.Window({
        // className: "test",
        child: Widget.CenterBox({
            startWidget: Left(),
            centerWidget: Center(),
            endWidget: Right(),
        }),
        name: `bar-${monitor}`, // name has to be unique
        anchor: ['top', 'left', 'right'],
        exclusivity: "exclusive",
        // focusable: true,  // if need to interact somehow
        layer: "bottom",  // "top" by default
        // margins: [8, 6],  // just like in CSS
        monitor: monitor,
        // popup: true,  // requires `focusable` I think

        className: 'bar',
        // classNames: [],
        // css: "",
        // hpack: "",
        // vpack: "",
        // cursor: "pointer",
        // hexpand: true,
        // vexpand: true,
        // sensitive: true,
        // tooltipText: "".
        // visible: true,  // no effect if parent calls show_all()
        // properties:  // TODO
        // connection:  // TODO
        // binds:  // TODO
        // setup:  // TODO
    })
}

// exporting the config so ags can manage the windows
export default {
    style: App.configDir + '/style.css',
    windows: [
        Bar(),

        // you can call it, for each monitor
        // Bar({ monitor: 0 }),
        // Bar({ monitor: 1 })
    ],
};