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

import { network_icons, network_disabled, workspaceIcons, lang_alias, pulseaudio_icons, scss_path, css_path, scratchpad_icon } from './defaults.js';
import { reloadCss, getIconByPercentage } from './helpers.js';

// TODO here should be some checks
// for example if sacss and inotifywait exists in system

reloadCss();
// CSS autoreload
subprocess([
    'inotifywait',
    '--recursive',
    '--event', 'create,modify',
    '-m', scss_path.split('/').slice(0, -1).join('/')
], () => {
    let f = reloadCss();
    App.resetCss();
    App.applyCss(f);
    console.log('CSS UPDATED');
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

// = WORKSPACES =
const swayWorkspaces = Variable([], {
    listen: [
        `${App.configDir}/scripts/workspaces_listener`,
        out => JSON.parse(out)
    ]
});

const swayScratchpad = Variable(0, {
    listen: [
        `${App.configDir}/scripts/scratchpad_listener`,
        out => parseInt(out)
    ]
});

function Workspaces() {
    function Scratchpad() {

        let label_text = '';
        if (swayScratchpad.value != 0) {
            label_text = `${swayScratchpad.value}`;
        }
        return Widget.Button({
            onPrimaryClick: () => execAsync('swaymsg scratchpad show'),
            onSecondaryClick: () => execAsync('swaymsg move scratchpad'),
            child: Widget.Label({
                label: `${scratchpad_icon}${label_text}`
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

////////

// = MODE =

const swayMode = Variable('default', {
    listen: [
        `${App.configDir}/scripts/mode_listener`,
        out => JSON.parse(out).name
    ]
});

const Mode = () => Widget.Revealer({
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
});

////////

// = MEDIA =

const Media = () => Widget.Button({
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
                // console.log(status.raw());
                switch (status) {
                    case "Playing":
                        statusIcon = '';  // TODO move to defaults
                        break;
                    case "Paused":
                        statusIcon = '';  // TODO move to defaults
                        break;
                    case "Stopped":
                        statusIcon = '';  // TODO move to defaults
                        break;
                    case undefined:
                        statusIcon = '';  // TODO move to defaults
                        break;
                    default:
                        statusIcon = '?';  // TODO move to defaults
                }

                // mpris player can be undefined
                if (mpris)
                    self.label = `${statusIcon} ${(mpris.trackArtists || []).join(', ')} | ${mpris.trackTitle}`;
                else
                    self.label = 'Nothing is playing';
            }
        ]],
    }),
});

////////

// = CLOCK =

const Clock = () => Widget.Label({
    className: 'clock',
    connections: [[
        1000,
        // self => execAsync(['date', '+%I:%M:%S'])
        //     .then(date => self.label = date)
        //     .catch(console.error)
        self => {
            self.label = ` ${(new Date()).toLocaleTimeString().padStart(11)}`;  // TODO move to defaults
        }
    ]],
});

////////

// = TRAY =

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
        }
    ]],
});

////////

// = LANGUAGE =

const lang = Variable("default", {
    listen: [
        `${App.configDir}/scripts/language_listener`,
        out => JSON.parse(out).lang
    ]
});

const Language = () => Widget.Button({
    onClicked: () => execAsync(`swaymsg input type:keyboard xkb_switch_layout next`),
    child: Widget.Label({
        connections: [[
            lang, self => {
                self.label = lang_alias[lang.value] || lang.value
            }
        ]]
    })
});

////////

// = AUDIO =

const _pulseaudio = Variable({
    "sink": {
        "volume": 0,
        "mute": false,
        "bluez": false
    },
    "source": {
        "volume": 0,
        "mute": false,
        "bluez": false
    }
}, {
    listen: [
        '/home/god/tmp/eww/pactl_py/.venv/bin/python /home/god/tmp/eww/pactl_py/new.py'.split(' '),
        out => JSON.parse(out)
    ]
});

const show_pulseaudio = Variable(false);
const show_pulseaudio_fixed = Variable(false);

function revealVol(obj) {
    let hovered = show_pulseaudio.value;
    let show = show_pulseaudio_fixed.value;
    let vol = _pulseaudio.value["sink"]["volume"];
    obj.revealChild = (hovered || show) && vol > 0;
};

const Volume = () => Widget.Button({
    onClicked: () => execAsync('pactl set-sink-mute @DEFAULT_SINK@ toggle'),
    onMiddleClick: () => show_pulseaudio_fixed.value = !show_pulseaudio_fixed.value,
    onHover: () => show_pulseaudio.value = true,
    onHoverLost: () => show_pulseaudio.value = false,
    child: Widget.Box({
        spacing: 2,
        children: [
            Widget.Label({
                connections: [[_pulseaudio, self => {
                    self.visible = _pulseaudio.value["sink"]["bluez"]
                }]],
                label: ''  // TODO move to defaults
            }),
            Widget.Label({
                connections: [[_pulseaudio, self => {
                    let l = '';
                    if (_pulseaudio.value["sink"]["mute"]) {
                        l = '';  // TODO move to defaults
                    } else {
                        let vol = Math.round(_pulseaudio.value["sink"]["volume"]);
                        if (vol == 0) {
                            l = '';  // TODO move to defaults
                        } else if (vol > 100) {
                            l = "";  // TODO move to defaults
                        } else {
                            l = getIconByPercentage(pulseaudio_icons, vol - 1);
                        }
                    }
                    self.label = l;
                }]],
                label: ''  // TODO move to defaults
            }),
            Widget.Revealer({
                revealChild: true,
                // transitionDuration: 500,
                transition: "slide_right",
                child: Widget.Label({
                    connections: [[_pulseaudio, self => {
                        self.label = `${Math.round(_pulseaudio.value["sink"]["volume"])}%`
                    }]],
                    label: '0'
                }),
                connections: [
                    [show_pulseaudio_fixed, self => revealVol(self)],
                    [show_pulseaudio, self => revealVol(self)],
                    [_pulseaudio, self => revealVol(self)],
                ]
            }),
            Widget.Box({
                children: [
                    Widget.Label({
                        connections: [[_pulseaudio, self => {
                            self.visible = _pulseaudio.value["source"]["bluez"]
                        }]],
                        label: ''  // TODO move to defaults
                    }),
                    Widget.Label({
                        label: ""  // TODO move to defaults
                    })
                ],
                connections: [[_pulseaudio, self => {
                    self.visible = !_pulseaudio.value["source"]["mute"]
                }]]
            }),
        ]
    })
});

////////

// = NETWORK =

const _network = Variable(0, {
    poll: [
        1000,
        `${App.configDir}/scripts/netpoll.sh`,
        out => parseInt(out)
    ]
});

// TODO reveal on hover/mmb
const Network = () => Widget.Button({
    child: Widget.Box({
        children: [
            Widget.Label({
                connections: [[
                    _network, self => {
                        let val = _network.value;
                        if (isNaN(val)) {
                            self.label = network_disabled;
                        } else {
                            self.label = getIconByPercentage(network_icons, val - 1, 70);
                        }
                    }
                ]]
            }),
            Widget.Revealer({
                revealChild: true,
                child: Widget.Label({ // TODO
                    connections: [[_network, self => {
                        let val = _network.value;
                        self.label = `${val}%`;
                    }]]
                })
            })
        ]
    })
});

////////

const BatteryLabel = () => Widget.Box({
    className: 'battery',
    children: [
        Widget.Icon({
            connections: [[Battery, self => {
                self.icon = `battery - level - ${Math.floor(Battery.percent / 10) * 10} -symbolic`;
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

// layout of the bar
const Left = () => Widget.Box({
    children: [
        Workspaces(),
        Mode(),
        // ClientTitle(),
        Media(),
    ],
});

const Center = () => Widget.Box({
    children: [
        // Notification(),
        Clock(),
    ],
});

const Right = () => Widget.Box({
    hpack: 'end',
    children: [
        Language(),
        SysTray(),
        Volume(),
        Network(),
        // BatteryLabel(),
    ],
});

const Bar = (monitor = 0) => Widget.Window({
    // className: "test",
    child: Widget.CenterBox({
        startWidget: Left(),
        centerWidget: Center(),
        endWidget: Right(),
    }),
    name: `bar - ${monitor} `, // name has to be unique
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
});

// exporting the config so ags can manage the windows
export default {
    style: css_path,
    windows: [
        Bar(),

        // you can call it, for each monitor
        // Bar({ monitor: 0 }),
        // Bar({ monitor: 1 })
    ],
};

// // TODO
// // we don't need dunst or any other notification daemon
// // because the Notifications module is a notification daemon itself
// function Notification() {
//     return Widget.Box({
//         className: 'notification',
//         children: [
//             Widget.Icon({
//                 icon: 'preferences-system-notifications-symbolic',
//                 connections: [[
//                     Notifications,
//                     self => self.visible = Notifications.popups.length > 0
//                 ]],
//             }),
//             Widget.Label({
//                 connections: [[
//                     Notifications,
//                     self => {
//                         self.label = Notifications.popups[0]?.summary || '';
//                     }
//                 ]],
//             }),
//         ],
//     });
// }