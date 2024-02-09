import App from 'resource:///com/github/Aylur/ags/app.js';
import { battery as BATTERY } from 'resource:///com/github/Aylur/ags/service/battery.js';
import {
    exec,
    execAsync,
    readFile,
    subprocess,
} from 'resource:///com/github/Aylur/ags/utils.js';
import Variable from 'resource:///com/github/Aylur/ags/variable.js';
import Widget from 'resource:///com/github/Aylur/ags/widget.js';
import SystemTray from 'resource:///com/github/Aylur/ags/service/systemtray.js';
import Mpris from 'resource:///com/github/Aylur/ags/service/mpris.js';
import {
    alert_icon,
    brightness_icon,
    battery_charging_icon,
    battery_icons,
    bluetooth_icon,
    cpu_icon,
    css_path,
    lang_alias,
    memory_icon,
    mic_icon,
    muted_icon,
    network_disabled,
    network_icons,
    player_icons,
    scratchpad_icon,
    scss_path,
    silent_icon,
    temp_path,
    temperature_icons,
    temperature_max,
    temperature_min,
    volume_icons,
    workspaceIcons,
    network_interface,
} from './defaults';
import {
    InputDevice,
    Node,
    XkbLayoutChange,
    getIconByPercentage as getIconFromArray,
    reloadCSS,
    removeItem,
    term,
} from './helpers';
import { Connectable } from 'resource:///com/github/Aylur/ags/widgets/widget.js';
import AgsButton from 'types/widgets/button';
import { Workspace, process_workspace_event } from './sway';
import { Variable as Variable_t } from 'types/variable';
import brightness from './service/brightness.js';

reloadCSS();
subprocess(
    [
        'inotifywait',
        '--recursive',
        '--event',
        'create,modify',
        '-m',
        scss_path.split('/').slice(0, -1).join('/'),
    ],
    () => {
        let f = reloadCSS();
        App.resetCss();
        App.applyCss(f);
        console.log('CSS UPDATED');
    },
);

// TODO
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

const swayWorkspaces: Variable_t<Workspace[]> = Variable(
    JSON.parse(await execAsync('i3-msg -t get_workspaces -r'.split(' '))),
    {
        listen: [
            `i3-msg -t subscribe '["workspace"]' -m -r`,
            (out) => process_workspace_event(swayWorkspaces.value, out),
        ],
    },
);

const Workspaces = Widget.Box({
    class_names: ['workspaces'],
}).bind('children', swayWorkspaces, 'value', (v) =>
    v.map((w) =>
        Widget.Button({
            on_clicked: () => execAsync(`swaymsg workspace ${w.name}`),
            child: Widget.Label({
                label: workspaceIcons[w.name] || workspaceIcons['default'],
            }),
            class_names: [
                'workspace',
                'widget',
                `${w.focused ? 'focused' : ''}`,
                `${w.visible ? 'visible' : ''}`,
                `${w.urgent ? 'urgent' : ''}`,
            ],
        }),
    ),
);

////////

// = SCRATCHPAD =

// TODO this is some shitty code
function get_scratch_windows(): number {
    let tree: Node = JSON.parse(exec('i3-msg -t get_tree -r'));

    let nodes = tree.nodes;
    if (nodes) {
        nodes = nodes.filter((n) => n.name == '__i3')[0].nodes;
        if (nodes) {
            let floating_nodes = nodes.filter(
                (n) => n.name == '__i3_scratch',
            )[0].floating_nodes;
            if (floating_nodes) return floating_nodes.length;
        }
    }
    return 0;
}
const sway_scratchpad = Variable(get_scratch_windows(), {
    listen: [
        `i3-msg -t subscribe '["workspace","window"]' -m -r`,
        (_) => get_scratch_windows(),
    ],
});

const show_scratchpad = Variable(false);
const show_scratchpad_fixed = Variable(false);

function revealScratchpad() {
    return (
        show_scratchpad.value ||
        show_scratchpad_fixed.value ||
        sway_scratchpad.value > 0
    );
}

function updateScratchpadClasses(obj: Connectable<AgsButton> & AgsButton) {
    if (
        show_scratchpad.value ||
        show_scratchpad_fixed.value ||
        sway_scratchpad.value > 0
    ) {
        obj.class_names = [...obj.class_names, 'fixed-hover'];
    } else {
        obj.class_names = removeItem(obj.class_names, 'fixed-hover');
    }
}

const Scratchpad = Widget.Button({
    on_primary_click: () => execAsync('swaymsg scratchpad show'),
    on_secondary_click: () => execAsync('swaymsg move scratchpad'),
    class_names: ['widget'],
    child: Widget.Box({
        class_names: ['scratchpad'],
        children: [
            Widget.Label({ label: scratchpad_icon }),
            Widget.Revealer({
                class_names: ['revealer'],
                transition: 'slide_right',
                transition_duration: 500,
                child: Widget.Label().bind(
                    'label',
                    sway_scratchpad,
                    'value',
                    (v) => `${v}`,
                ),
            })
                .bind('reveal_child', show_scratchpad, 'value', () =>
                    revealScratchpad(),
                )
                .bind('reveal_child', show_scratchpad_fixed, 'value', () =>
                    revealScratchpad(),
                )
                .bind('reveal_child', sway_scratchpad, 'value', () =>
                    revealScratchpad(),
                ),
        ],
    }),
})
    .hook(sway_scratchpad, (btn) => updateScratchpadClasses(btn))
    .hook(show_scratchpad, (btn) => updateScratchpadClasses(btn))
    .hook(show_scratchpad_fixed, (btn) => updateScratchpadClasses(btn));

////////

// = MODE =

type mode_t = {
    name: string;
};
type mode_event_t = {
    change: string;
    pango_markup: boolean;
};
const swayMode: Variable_t<mode_t> = Variable(
    JSON.parse(await execAsync('i3-msg -t get_binding_state -r')),
    {
        listen: [
            `i3-msg -t subscribe "['mode']" -m -r`,
            (out) => {
                let mode_event: mode_event_t = JSON.parse(out);
                return { name: mode_event.change };
            },
        ],
    },
);

const Mode = Widget.Revealer({
    transition_duration: 500,
    transition: 'slide_right',
    child: Widget.Button({
        on_clicked: () => execAsync('swaymsg mode default'),
        // cursor: 'pointer',
        child: Widget.Label().hook(swayMode, (self) => {
            let mode = swayMode.value.name;
            if (mode != 'default') self.label = mode;
        }),
        class_names: ['widget', 'mode'],
    }).hook(swayMode, (self) => {
        let old_modes = self.class_names.filter((m) => m.startsWith('mode_'));
        if (old_modes.length > 1) {
            console.error(`Modes more than one!!! (${old_modes.join(', ')})`);
        }
        let old_mode = old_modes[0];
        if (old_mode) {
            self.class_names = removeItem(self.class_names, `${old_mode}`);
        }
        self.class_names = [...self.class_names, `mode_${swayMode.value.name}`];
    }),
}).bind('revealChild', swayMode, 'value', (v) => v.name != 'default');

////////

// = MEDIA =

// TODO debug
const Media = Widget.Button({
    class_name: 'media',
    on_primary_click: () => Mpris.getPlayer('')?.playPause(),
    on_scroll_up: () => Mpris.getPlayer('')?.next(),
    on_scroll_down: () => Mpris.getPlayer('')?.previous(),
    child: Widget.Label({}).bind('label', Mpris, 'players', (v) => {
        // TODO iterate over `v` filtering by currently playing
        // console.log(v);
        let player = Mpris.getPlayer('');
        if (player) {
            // console.log(player);
            let status = player.play_back_status;

            let statusIcon = status
                ? {
                      Playing: player_icons.play,
                      Paused: player_icons.pause,
                      Stopped: player_icons.stop,
                  }[status]
                : '';

            return `${statusIcon} ${(player.track_artists || []).join(
                ', ',
            )} | ${player.track_title}`;
        }
        return 'Nothing is playing';
    }),
});

////////

// = CLOCK =

const date = Variable('', {
    poll: [1000, () => ` ${new Date().toLocaleTimeString().padStart(11)}`],
});

const Clock = Widget.Label({
    class_names: ['clock', 'widget'],
}).bind('label', date);

////////

// = TRAY =

const SysTray = Widget.Box({
    class_names: 'widget tray hoverable'.split(' '),
}).hook(SystemTray, (self) => {
    self.children = SystemTray.items.map((item) =>
        Widget.Button({
            child: Widget.Icon().bind('icon', item, 'icon'),
            on_primary_click: (_, e) => item.activate(e),
            on_secondary_click: (_, e) => item.openMenu(e),
        }).bind('tooltip_markup', item, 'tooltip_markup'),
    );
});

////////

// = LANGUAGE =

// TODO this is some shitty code
function get_active_layout_name(): string {
    let out: InputDevice[] = JSON.parse(exec('swaymsg -t get_inputs -r'));
    let layout = out.filter(
        (i) => i.type == 'keyboard' && i.xkb_layout_names,
    )[0].xkb_active_layout_name;
    if (layout) return layout;
    return '';
}
const input_event: Variable_t<XkbLayoutChange> = Variable(
    {},
    {
        listen: [
            `i3-msg -t subscribe '["input"]' -m -r`,
            (out) => JSON.parse(out),
        ],
    },
);
input_event.connect('changed', ({ value }) => {
    if (value.change != 'xkb_layout') {
        return;
    }

    let current_layout = value.input.xkb_active_layout_name;
    if (current_layout != lang.value) {
        lang.value = current_layout;
    }
});

const lang = Variable(get_active_layout_name());

const Language = Widget.Button({
    on_clicked: () =>
        execAsync('swaymsg input type:keyboard xkb_switch_layout next'),
    class_names: ['widget'],
    child: Widget.Label()
        .bind('label', lang, 'value', (v) => lang_alias[v] || v)
        .bind('tooltip_text', lang),
});

////////

// = TEMPERATURE =

const TEMPERATURE = Variable(0, {
    poll: [
        2000,
        () => {
            return parseInt(readFile(temp_path).trim()) / 1000;
        },
    ],
});

const show_temperature = Variable(false);
const show_temperature_fixed = Variable(false);

function revealTemp() {
    return show_temperature.value || show_temperature_fixed.value;
}

function updateTempClasses(obj: Connectable<AgsButton> & AgsButton) {
    if (show_temperature.value || show_temperature_fixed.value) {
        obj.class_names = [...obj.class_names, 'fixed-hover'];
    } else {
        obj.class_names = removeItem(obj.class_names, 'fixed-hover');
    }

    if (TEMPERATURE.value > temperature_max) {
        obj.class_names = [...obj.class_names, 'urgent'];
    } else {
        obj.class_names = removeItem(obj.class_names, 'urgent');
    }
}

const Temperature = Widget.Button({
    on_hover: () => (show_temperature.value = true),
    on_hover_lost: () => (show_temperature.value = false),
    on_middle_click: () =>
        (show_temperature_fixed.value = !show_temperature_fixed.value),
    class_names: ['widget'],
    child: Widget.Box({
        class_names: ['temp'],
        children: [
            Widget.Label().bind('label', TEMPERATURE, 'value', (v) => {
                return getIconFromArray(
                    temperature_icons.split(''),
                    v,
                    temperature_min,
                    temperature_max,
                );
            }),
            Widget.Revealer({
                transition_duration: 500,
                transition: 'slide_right',
                class_names: ['revealer', 'right'],
                child: Widget.Label().bind(
                    'label',
                    TEMPERATURE,
                    'value',
                    (v) => `${v}º`,
                ),
            })
                .bind('reveal_child', show_temperature, 'value', (_) =>
                    revealTemp(),
                )
                .bind('reveal_child', show_temperature_fixed, 'value', (_) =>
                    revealTemp(),
                ),
        ],
    }),
})
    .hook(show_temperature, (self) => updateTempClasses(self))
    .hook(show_temperature_fixed, (self) => updateTempClasses(self))
    .hook(TEMPERATURE, (self) => updateTempClasses(self));

////////

// = MEMORY =

const MEMORY = Variable([], {
    poll: [
        2000,
        () => {
            return JSON.parse(exec('jc free -tvw --si'));
        },
    ],
});

const show_memory = Variable(false);
const show_memory_fixed = Variable(false);

function revealMem() {
    return show_memory.value || show_memory_fixed.value;
}

function updateMemoryClasses(obj: Connectable<AgsButton> & AgsButton) {
    if (show_memory.value || show_memory_fixed.value) {
        obj.class_names = [...obj.class_names, 'fixed-hover'];
    } else {
        obj.class_names = removeItem(obj.class_names, 'fixed-hover');
    }

    if (
        (function () {
            let Mem = MEMORY.value.filter(
                (o: { type: string }) => o.type == 'Mem',
            );
            let percent = 0;
            if (Mem) {
                percent = (Mem[0].used / Mem[0].total) * 100;
            } else {
                console.error("Can't find Mem!!!");
            }
            return percent;
        })() > 80 // TODO move urgent memory to config
    ) {
        obj.class_names = [...obj.class_names, 'urgent'];
    } else {
        obj.class_names = removeItem(obj.class_names, 'urgent');
    }
}

// TODO simplify progress binders
const Memory = Widget.Button({
    on_hover: () => (show_memory.value = true),
    on_hover_lost: () => (show_memory.value = false),
    on_middle_click: () => (show_memory_fixed.value = !show_memory_fixed.value),
    class_names: ['widget'],
    child: Widget.Box({
        class_names: ['memory'],
        children: [
            Widget.Label({ label: memory_icon }),
            Widget.Revealer({
                transition: 'slide_right',
                transition_duration: 500,
                class_names: ['revealer'],
                child: Widget.Box({
                    children: [
                        Widget.ProgressBar({
                            vertical: true,
                            inverted: true,
                            class_names: ['progress', 'vertical'],
                        }).bind('value', MEMORY, 'value', (v) => {
                            let t = v.filter(
                                (obj: { type: string }) => obj.type == 'Mem',
                            )[0];
                            let val = 0;
                            if (t) {
                                val = t.used / t.total;
                            }
                            return val;
                        }),
                        Widget.ProgressBar({
                            vertical: true,
                            inverted: true,
                            class_names: ['progress', 'vertical'],
                        }).bind('value', MEMORY, 'value', (v) => {
                            let t = v.filter(
                                (obj: { type: string }) => obj.type == 'Swap',
                            )[0];
                            let val = 0;
                            if (t) {
                                val = t.used / t.total;
                            }
                            return val;
                        }),
                    ],
                }),
            })
                .bind('reveal_child', show_memory, 'value', (_) => revealMem())
                .bind('reveal_child', show_memory_fixed, 'value', (_) =>
                    revealMem(),
                ),
        ],
    }),
})
    .hook(show_memory, (self) => updateMemoryClasses(self))
    .hook(show_memory_fixed, (self) => updateMemoryClasses(self))
    .hook(MEMORY, (self) => updateMemoryClasses(self));

////////

// = CPU =

/**
 * `mpstat` wrapper
 * @param out Output of mpstat in JSON
 */
const wrap_mpstat = (out: string) => {
    return {
        avg: JSON.parse(out).filter(
            (core: { time: string | undefined; cpu: string }) =>
                core.time && core.cpu == 'all',
        )[0],
        cores: JSON.parse(out)
            .filter(
                (core: { time: string; cpu: string }) =>
                    core.time && core.cpu != 'all',
            )
            .sort(
                (coreA: { cpu: string }, coreB: { cpu: string }) =>
                    parseInt(coreA.cpu) > parseInt(coreB.cpu),
            ),
    };
};

const _cpu = Variable(wrap_mpstat(exec('jc mpstat -P ALL')), {
    poll: [2000, 'jc mpstat -P ALL 2 1', (out) => wrap_mpstat(out)],
});

const show_cpu_cores = Variable(false);
const show_cpu_cores_fixed = Variable(false);

function revealCPU() {
    return show_cpu_cores.value || show_cpu_cores_fixed.value;
}

// console.log(_cpu.value.cores[0]);

// TODO
function updateCPUClasses(obj: Connectable<AgsButton> & AgsButton) {
    if (show_cpu_cores.value || show_cpu_cores_fixed.value) {
        obj.class_names = [...obj.class_names, 'fixed-hover'];
    } else {
        obj.class_names = removeItem(obj.class_names, 'fixed-hover');
    }

    if (
        100 - _cpu.value.avg.percent_idle >
        90 // TODO move max_cpu_usage to config
    ) {
        obj.class_names = [...obj.class_names, 'urgent'];
    } else {
        obj.class_names = removeItem(obj.class_names, 'urgent');
    }
}

const CPU = Widget.Button({
    on_hover: () => (show_cpu_cores.value = true),
    on_hover_lost: () => (show_cpu_cores.value = false),
    on_middle_click: () =>
        (show_cpu_cores_fixed.value = !show_cpu_cores_fixed.value),
    on_clicked: () => term('btop'),
    class_names: ['widget'],
    child: Widget.Box({
        class_names: ['cpu'],
        children: [
            Widget.Label({ label: cpu_icon }),
            Widget.Revealer({
                class_names: ['revealer'],
                transition: 'slide_right',
                transition_duration: 500,
                child: Widget.Box({
                    children: _cpu.value.cores.map((core: { cpu: string }) =>
                        Widget.ProgressBar({
                            vertical: true,
                            inverted: true,
                            class_names: ['progress', 'vertical'],
                        }).bind(
                            'value',
                            _cpu,
                            'value',
                            (cpu_stat) =>
                                (100 -
                                    cpu_stat.cores[parseInt(core.cpu)]
                                        .percent_idle) /
                                100,
                        ),
                    ),
                }),
            })
                .bind('reveal_child', show_cpu_cores, 'value', (_) =>
                    revealCPU(),
                )
                .bind('reveal_child', show_cpu_cores_fixed, 'value', (_) =>
                    revealCPU(),
                ),
        ],
    }),
})
    .hook(show_cpu_cores, (self) => updateCPUClasses(self))
    .hook(show_cpu_cores_fixed, (self) => updateCPUClasses(self))
    .hook(_cpu, (self) => updateCPUClasses(self));

////////

// = BRIGHTNESS =

const show_brightness = Variable(false);
const show_brightness_fixed = Variable(false);

function revealBrightness() {
    return show_brightness.value || show_brightness_fixed.value;
}

function updateBrightnessClasses(obj: Connectable<AgsButton> & AgsButton) {
    if (show_brightness.value || show_brightness_fixed.value) {
        obj.class_names = [...obj.class_names, 'fixed-hover'];
    } else {
        obj.class_names = removeItem(obj.class_names, 'fixed-hover');
    }
}

const Brightness = Widget.Button({
    on_hover: () => (show_brightness.value = true),
    on_hover_lost: () => (show_brightness.value = false),
    on_middle_click: () =>
        (show_brightness_fixed.value = !show_brightness_fixed.value),
    on_scroll_up: () => execAsync('brightnessctl -e s 1-%'),
    on_scroll_down: () => execAsync('brightnessctl -e s 1+%'),
    child: Widget.Box({
        class_names: ['brightness'],
        children: [
            Widget.Label({ label: brightness_icon }),
            Widget.Revealer({
                transition: 'slide_right',
                transition_duration: 500,
                class_names: ['revealer'],
                child: Widget.ProgressBar({
                    vertical: true,
                    inverted: true,
                    class_names: ['progress', 'vertical'],
                }).bind('value', brightness, 'screen_value'),
            })
                .bind('reveal_child', show_brightness, 'value', (_) =>
                    revealBrightness(),
                )
                .bind('reveal_child', show_brightness_fixed, 'value', (_) =>
                    revealBrightness(),
                ),
        ],
    }),
})
    .bind('visible', brightness, 'screen_value', (v) => v < 1)
    .hook(show_brightness, (self) => updateBrightnessClasses(self))
    .hook(show_brightness_fixed, (self) => updateBrightnessClasses(self));

////////

// = VOLUME =

const VOLUME = Variable(
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
            '/home/god/tmp/eww/pactl_py/.venv/bin/python /home/god/tmp/eww/pactl_py/new.py'.split(
                ' ',
            ),
            (out) => JSON.parse(out),
        ],
    },
);

function revealVol() {
    let hovered = show_pulseaudio.value;
    let show = show_pulseaudio_fixed.value;
    let vol = VOLUME.value['sink']['volume'];
    return (hovered || show) && vol > 0;
}

const show_pulseaudio_fixed = Variable(false);
const show_pulseaudio = Variable(false);

function updateVolumeClasses(obj: Connectable<AgsButton> & AgsButton) {
    if (show_pulseaudio.value || show_pulseaudio_fixed.value) {
        obj.class_names = [...obj.class_names, 'fixed-hover'];
    } else {
        obj.class_names = removeItem(obj.class_names, 'fixed-hover');
    }

    if (Math.round(VOLUME.value.sink.volume) > 100) {
        obj.class_names = [...obj.class_names, 'urgent'];
    } else {
        obj.class_names = removeItem(obj.class_names, 'urgent');
    }

    if (VOLUME.value.sink.mute) {
        obj.class_names = [...obj.class_names, 'disabled'];
    } else {
        obj.class_names = removeItem(obj.class_names, 'disabled');
    }
}

const Volume = Widget.Button({
    on_clicked: () => execAsync('pactl set-sink-mute @DEFAULT_SINK@ toggle'),
    on_middle_click: () =>
        (show_pulseaudio_fixed.value = !show_pulseaudio_fixed.value),
    on_hover: () => (show_pulseaudio.value = true),
    on_hover_lost: () => (show_pulseaudio.value = false),
    class_names: ['widget'],
    child: Widget.Box({
        spacing: 2,
        class_names: ['pulseaudio'],
        children: [
            Widget.Label({ label: bluetooth_icon }).bind(
                'visible',
                VOLUME,
                'value',
                (v) => v['sink']['bluez'],
            ),
            Widget.Label().bind('label', VOLUME, 'value', (v) => {
                if (v['sink']['mute']) {
                    return muted_icon;
                }

                let vol = Math.round(v['sink']['volume']);
                if (vol == 0) {
                    return silent_icon;
                }
                if (vol > 100) {
                    return alert_icon;
                }
                return getIconFromArray(volume_icons.split(''), vol);
            }),
            Widget.Revealer({
                reveal_child: false,
                transition: 'slide_right',
                class_names: ['revealer'],
                child: Widget.Label().bind(
                    'label',
                    VOLUME,
                    'value',
                    (v) => `${Math.round(v['sink']['volume'])}%`,
                ),
            })
                .bind('revealChild', VOLUME, 'value', (v) => revealVol())
                .bind('revealChild', show_pulseaudio, 'value', (v) =>
                    revealVol(),
                )
                .bind('revealChild', show_pulseaudio_fixed, 'value', (v) =>
                    revealVol(),
                ),
            Widget.Box({
                children: [
                    Widget.Label({ label: bluetooth_icon }).bind(
                        'visible',
                        VOLUME,
                        'value',
                        (v) => v['source']['bluez'],
                    ),
                    Widget.Label({ label: mic_icon }),
                ],
            }).bind('visible', VOLUME, 'value', (v) => !v['source']['mute']),
        ],
    }),
})
    .hook(show_pulseaudio, (self) => updateVolumeClasses(self))
    .hook(show_pulseaudio_fixed, (self) => updateVolumeClasses(self))
    .hook(VOLUME, (self) => updateVolumeClasses(self));

////////

// = NETWORK =

const NETWORK: Variable_t<null | number> = Variable(null, {
    poll: [
        2000,
        `jc iw dev ${network_interface} link`,
        (out) => {
            let data = JSON.parse(out);
            if (data.length == 0) return null;

            return Math.round(2 * (data[0].signal_dbm + 100));
        },
    ],
});

const show_network = Variable(false);
const show_network_fixed = Variable(false);

function revealNet() {
    return show_network.value || show_network_fixed.value;
}

function updateNetworkClasses(obj: Connectable<AgsButton> & AgsButton) {
    if (show_network.value || show_network_fixed.value) {
        obj.class_names = [...obj.class_names, 'fixed-hover'];
    } else {
        obj.class_names = removeItem(obj.class_names, 'fixed-hover');
    }

    if (NETWORK.value == null) {
        obj.class_names = [...obj.class_names, 'disabled'];
    } else {
        obj.class_names = removeItem(obj.class_names, 'disabled');
    }
}

const Network = Widget.Button({
    on_secondary_click: () => term('bluetuith'),
    on_middle_click: () =>
        (show_network_fixed.value = !show_network_fixed.value),
    on_hover: () => (show_network.value = true),
    on_hover_lost: () => (show_network.value = false),
    class_names: ['widget'],
    child: Widget.Box({
        class_names: ['network'],
        children: [
            Widget.Label().bind('label', NETWORK, 'value', (v) =>
                v == null
                    ? network_disabled
                    : getIconFromArray(network_icons.split(''), v),
            ),
            Widget.Revealer({
                transition: 'slide_right',
                transition_duration: 500,
                class_names: ['revealer'],
                child: Widget.Label().bind(
                    'label',
                    NETWORK,
                    'value',
                    (v) => `${v}%`,
                ),
            })
                .bind('reveal_child', show_network, 'value', (_) => revealNet())
                .bind('reveal_child', show_network_fixed, 'value', (_) =>
                    revealNet(),
                )
                .bind('visible', NETWORK, 'value', (v) => v != null),
        ],
    }),
})
    .hook(show_network, (self) => updateNetworkClasses(self))
    .hook(show_network_fixed, (self) => updateNetworkClasses(self));

////////

// = BATTERY

const show_battery = Variable(false);
const show_battery_fixed = Variable(false);

function revealBat() {
    return show_battery.value || show_battery_fixed.value;
}

function updateBatteryClasses(obj: Connectable<AgsButton> & AgsButton) {
    if (show_battery.value || show_battery_fixed.value) {
        obj.class_names = [...obj.class_names, 'fixed-hover'];
    } else {
        obj.class_names = removeItem(obj.class_names, 'fixed-hover');
    }

    if (
        BATTERY.percent <= 10 && // TODO move urgent battery percent to config
        !BATTERY.charging
    ) {
        obj.class_names = [...obj.class_names, 'urgent'];
    } else {
        obj.class_names = removeItem(obj.class_names, 'urgent');
    }
}

const Battery = Widget.Button({
    on_hover: () => (show_battery.value = true),
    on_hover_lost: () => (show_battery.value = false),
    on_middle_click: () =>
        (show_battery_fixed.value = !show_battery_fixed.value),
    class_names: ['widget'],
    child: Widget.Box({
        class_names: ['battery'],
        children: [
            Widget.Label().hook(BATTERY, (self) => {
                if (BATTERY.charging) {
                    self.label = battery_charging_icon;
                    return;
                }

                self.label = getIconFromArray(
                    battery_icons.split(''),
                    BATTERY.percent,
                );
            }),
            Widget.Revealer({
                transition: 'slide_right',
                transition_duration: 500,
                class_names: ['revealer'],
                child: Widget.Label().bind(
                    'label',
                    BATTERY,
                    'percent',
                    (v) => `${Math.round(v)}%`,
                ),
            })
                .bind('reveal_child', show_battery, 'value', (_) => revealBat())
                .bind('reveal_child', show_battery_fixed, 'value', (_) =>
                    revealBat(),
                ),
        ],
    }),
})
    .hook(show_battery, (self) => updateBatteryClasses(self))
    .hook(show_battery_fixed, (self) => updateBatteryClasses(self))
    .hook(BATTERY, (self) => updateBatteryClasses(self));

////////

// TODO
const Left = Widget.Box({
    class_names: ['modules-left'],
    children: [Workspaces, Scratchpad, Mode, Media],
});

const Center = Widget.Box({
    class_names: ['modules-center'],
    children: [Clock],
});

// TODO
const Right = Widget.Box({
    class_names: ['modules-right'],
    hpack: 'end',
    children: [
        SysTray,
        // TODO runcat
        // TODO touchpad
        Language,
        Temperature,
        Memory,
        CPU,
        Brightness,
        Volume,
        Network,
        Battery,
    ],
});

const Bar = (monitor: number = 0) =>
    Widget.Window({
        child: Widget.CenterBox({
            start_widget: Left,
            center_widget: Center,
            end_widget: Right,
        }),
        name: `bar - ${monitor}`, // name has to be unique
        anchor: ['top', 'left', 'right'],
        exclusivity: 'exclusive',
        // focusable: true,  // if need to interact somehow
        layer: 'bottom', // "top" by default
        // margins: [8, 6],  // just like in CSS
        monitor: monitor,
        // popup: true,  // requires `focusable` I think
        class_names: ['bar'],
        // hpack: "",
        // vpack: "",
        // cursor: "pointer",
        // hexpand: true,
        // vexpand: true,
        // sensitive: true,
        // tooltipText: "",
    });

export default {
    style: css_path,
    windows: [Bar()],
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
