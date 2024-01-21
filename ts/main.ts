import App from "resource:///com/github/Aylur/ags/app.js";
import {
    execAsync,
    subprocess,
} from "resource:///com/github/Aylur/ags/utils.js";
import Variable from "resource:///com/github/Aylur/ags/variable.js";
import Widget from "resource:///com/github/Aylur/ags/widget.js";
import SystemTray from "resource:///com/github/Aylur/ags/service/systemtray.js";
import Mpris from "resource:///com/github/Aylur/ags/service/mpris.js";
import {
    alert_icon,
    bluetooth_icon,
    css_path,
    lang_alias,
    mic_icon,
    muted_icon,
    network_disabled,
    network_icons,
    player_icons,
    scratchpad_icon,
    scss_path,
    silent_icon,
    volume_icons,
    workspaceIcons,
} from "./defaults";
import { getIconByPercentage, reloadCss as reloadCSS } from "./helpers";

reloadCSS();
subprocess(
    [
        "inotifywait",
        "--recursive",
        "--event",
        "create,modify",
        "-m",
        scss_path.split("/").slice(0, -1).join("/"),
    ],
    () => {
        let f = reloadCSS();
        App.resetCss();
        App.applyCss(f);
        console.log("CSS UPDATED");
    }
);

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
        (out) => JSON.parse(out),
    ],
});

const Workspaces = Widget.Box({
    class_name: "workspaces",
}).bind("children", swayWorkspaces, "value", (v) => {
    return v.map(
        (w: { name: string | number; focused: any; visible: any; urgent: any }) =>
            Widget.Button({
                on_clicked: () => execAsync(`swaymsg workspace ${w.name}`),
                child: Widget.Label({
                    label: workspaceIcons[w.name] || workspaceIcons["default"],
                }),
                cursor: "pointer",
                class_names: [
                    `${w.focused ? "focused" : ""}`,
                    `${w.visible ? "visible" : ""}`,
                    `${w.urgent ? "urgent" : ""}`,
                ],
            })
    );
});

////////

// = SCRATCHPAD =

const swayScratchpad = Variable(0, {
    listen: [
        `${App.configDir}/scripts/scratchpad_listener`,
        (out) => parseInt(out),
    ],
});

const Scratchpad = Widget.Button({
    on_primary_click: () => execAsync("swaymsg scratchpad show"),
    on_secondary_click: () => execAsync("swaymsg move scratchpad"),
    child: Widget.Label({}).bind(
        "label",
        swayScratchpad,
        "value",
        (v) => `${scratchpad_icon}${v != 0 ? v : ""}`
    ),
});

////////

// = MODE =

const swayMode = Variable("default", {
    listen: [
        `${App.configDir}/scripts/mode_listener`,
        (out) => JSON.parse(out).name,
    ],
});

// TODO you should not return `undefined` as label text!
const Mode = Widget.Revealer({
    transition_duration: 500,
    transition: "slide_right",
    child: Widget.Button({
        on_clicked: () => execAsync("swaymsg mode default"),
        cursor: "pointer",
        child: Widget.Label({
            label: "MODE",
        }).bind("label", swayMode, "value", (v) =>
            v != "default" ? v : undefined
        ),
    }),
}).bind("revealChild", swayMode, "value", (v) => v != "default");

////////

// = MEDIA =

// TODO debug
const Media = Widget.Button({
    class_name: "media",
    on_primary_click: () => Mpris.getPlayer("")?.playPause(),
    on_scroll_up: () => Mpris.getPlayer("")?.next(),
    on_scroll_down: () => Mpris.getPlayer("")?.previous(),
    child: Widget.Label({}).bind("label", Mpris, "players", (v) => {
        // TODO iterate over `v` filtering by currently playing
        console.log(v);
        let player = Mpris.getPlayer("");
        if (player) {
            console.log(player);
            let status = player.play_back_status;

            let statusIcon = status
                ? {
                    Playing: player_icons.play,
                    Paused: player_icons.pause,
                    Stopped: player_icons.stop,
                }[status]
                : "";

            return `${statusIcon} ${(player.track_artists || []).join(", ")} | ${player.track_title
                }`;
        }
        return "Nothing is playing";
    }),
});

////////

// = CLOCK =

const date = Variable("", {
    poll: [1000, () => ` ${new Date().toLocaleTimeString().padStart(11)}`],
});

const Clock = Widget.Label({
    class_name: "clock",
}).bind("label", date);

////////

// = TRAY =

// TODO rework
const SysTray = Widget.Box({
    // @ts-ignore
    connections: [
        [
            SystemTray,
            (self) => {
                self.children = SystemTray.items.map((item) =>
                    Widget.Button({
                        child: Widget.Icon({
                            // @ts-ignore
                            binds: [["icon", item, "icon"]],
                        }),
                        // @ts-ignore
                        onPrimaryClick: (_, event) => item.activate(event),
                        onSecondaryClick: (_, event) => item.openMenu(event),
                        binds: [["tooltip-markup", item, "tooltip-markup"]],
                    })
                );
            },
        ],
    ],
});

////////

// = LANGUAGE =

const lang = Variable("default", {
    listen: [
        `${App.configDir}/scripts/language_listener`,
        (out) => {
            let val = JSON.parse(out).lang;
            return lang_alias[val] || val;
        },
    ],
});

const Language = Widget.Button({
    on_clicked: () =>
        execAsync("swaymsg input type:keyboard xkb_switch_layout next"),
    child: Widget.Label({}).bind("label", lang),
});

////////

// = VOLUME =

const volume = Variable(
    {
        sink: {
            volume: 0,
            mute: false,
            bluez: false,
        },
        source: {
            volume: 0,
            mute: false,
            bluez: false,
        },
    },
    {
        listen: [
            "/home/god/tmp/eww/pactl_py/.venv/bin/python /home/god/tmp/eww/pactl_py/new.py".split(
                " "
            ),
            (out) => JSON.parse(out),
        ],
    }
);

function revealVol() {
    let hovered = show_pulseaudio.value;
    let show = show_pulseaudio_fixed.value;
    let vol = volume.value["sink"]["volume"];
    return (hovered || show) && vol > 0;
}

const show_pulseaudio_fixed = Variable(false);
const show_pulseaudio = Variable(false);

const Volume = Widget.Button({
    on_clicked: () => execAsync("pactl set-sink-mute @DEFAULT_SINK@ toggle"),
    on_middle_click: () =>
        (show_pulseaudio_fixed.value = !show_pulseaudio_fixed.value),
    on_hover: () => (show_pulseaudio.value = true),
    on_hover_lost: () => (show_pulseaudio.value = false),
    child: Widget.Box({
        spacing: 2,
        children: [
            Widget.Label({ label: bluetooth_icon }).bind(
                "visible",
                volume,
                "value",
                (v) => v["sink"]["bluez"]
            ),
            Widget.Label().bind("label", volume, "value", (v) => {
                if (v["sink"]["mute"]) {
                    return muted_icon;
                }

                let vol = Math.round(v["sink"]["volume"]);
                if (vol == 0) {
                    return silent_icon;
                }
                if (vol > 100) {
                    return alert_icon;
                }
                return getIconByPercentage(volume_icons.split(""), vol - 1);
            }),
            Widget.Revealer({
                reveal_child: false,
                transition: "slide_right",
                child: Widget.Label().bind(
                    "label",
                    volume,
                    "value",
                    (v) => `${Math.round(v["sink"]["volume"])}%`
                ),
            })
                .bind("revealChild", volume, "value", (v) => revealVol())
                .bind("revealChild", show_pulseaudio, "value", (v) => revealVol())
                .bind("revealChild", show_pulseaudio_fixed, "value", (v) =>
                    revealVol()
                ),
            Widget.Box({
                children: [
                    Widget.Label({ label: bluetooth_icon }).bind(
                        "visible",
                        volume,
                        "value",
                        (v) => v["source"]["bluez"]
                    ),
                    Widget.Label({ label: mic_icon }),
                ],
            }).bind("visible", volume, "value", (v) => !v["source"]["mute"]),
        ],
    }),
});

////////

// = NETWORK =

const network = Variable(0, {
    poll: [1000, `${App.configDir}/scripts/netpoll.sh`, (out) => parseInt(out)],
});

// TODO reveal on hover/mmb
const Network = Widget.Button({
    child: Widget.Box({
        children: [
            Widget.Label().bind("label", network, "value", (v) =>
                isNaN(v)
                    ? network_disabled
                    : getIconByPercentage(network_icons.split(""), v - 1, 70)
            ),
            Widget.Revealer({
                reveal_child: false,
                child: Widget.Label().bind(
                    "label",
                    network,
                    "value",
                    (v) => `${Math.round(100 * (v / 70))}%`
                ),
            }).bind("reveal_child", network, "value", (v) => v > 0),
        ],
    }),
});

////////

// TODO
const Left = Widget.Box({
    children: [Workspaces, Scratchpad, Mode, Media],
});

const Center = Widget.Box({
    children: [Clock],
});

// TODO
const Right = Widget.Box({
    hpack: "end",
    children: [SysTray, Language, Volume, Network],
});

const Bar = (monitor: number = 0) =>
    Widget.Window({
        child: Widget.CenterBox({
            start_widget: Left,
            center_widget: Center,
            end_widget: Right,
        }),
        name: `bar - ${monitor}`, // name has to be unique
        anchor: ["top", "left", "right"],
        exclusivity: "exclusive",
        // focusable: true,  // if need to interact somehow
        layer: "bottom", // "top" by default
        // margins: [8, 6],  // just like in CSS
        monitor: monitor,
        // popup: true,  // requires `focusable` I think
        // class_name: 'bar',
        class_names: ["bar"],
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

export default {
    style: css_path,
    windows: [Bar()],
};

// // TODO
// const BatteryLabel = () => Widget.Box({
//     className: 'battery',
//     children: [
//         Widget.Icon({
//             connections: [[Battery, self => {
//                 self.icon = `battery - level - ${Math.floor(Battery.percent / 10) * 10} -symbolic`;
//             }]]
//         }),
//         Widget.ProgressBar({
//             vpack: 'center',
//             connections: [[Battery, self => {
//                 if (Battery.percent < 0)
//                     return;

//                 self.fraction = Battery.percent / 100;
//             }]],
//         }),
//     ],
// });

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
