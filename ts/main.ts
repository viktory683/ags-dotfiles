import battery from 'resource:///com/github/Aylur/ags/service/battery.js';
import {
    exec,
    execAsync,
    monitorFile,
    readFile,
} from 'resource:///com/github/Aylur/ags/utils.js';
import Variable from 'resource:///com/github/Aylur/ags/variable.js';
import Widget from 'resource:///com/github/Aylur/ags/widget.js';
import { Connectable } from 'resource:///com/github/Aylur/ags/widgets/widget.js';
import SystemTray from 'resource:///com/github/Aylur/ags/service/systemtray.js';
import AgsButton from 'types/widgets/button';
import { Variable as Variable_t } from 'types/variable';
import config from './config';
import { InputDevice, TreeNode, XkbLayoutChange, mode_t } from './types/sway';
import {
    getIconByPercentage as getIconFromArray,
    reloadCSS,
    term,
    wrapMpstat,
} from './helpers';
import brightness from './service/brightness';
import { Workspace, processWorkspaceEvent } from './sway';
import { format } from 'date-fns';

// CSS UPDATE

reloadCSS();

monitorFile(config.CSS.paths.scss, (_, event) => {
    if (event != 1) return;
    reloadCSS();
});

// ..

// WORKSPACES
const swayWorkspaces: Variable_t<Workspace[]> = Variable(
    JSON.parse(await execAsync('i3-msg -t get_workspaces -r')),
    {
        listen: [
            `i3-msg -t subscribe '["workspace"]' -m -r`,
            (out) => processWorkspaceEvent(swayWorkspaces.value, out),
        ],
    },
);

const Workspaces = Widget.Box({
    class_names: ['workspaces'],
}).bind('children', swayWorkspaces, 'value', (workspaces) =>
    workspaces.map((workspace) =>
        Widget.Button({
            on_clicked: () => execAsync(`swaymsg workspace ${workspace.name}`),
            child: Widget.Label({
                label:
                    config.workspaces.icons[workspace.name] ||
                    config.workspaces.icons['default'],
            }),
            class_names: [
                'workspace',
                'widget',
                `${workspace.focused ? 'focused' : ''}`,
                `${workspace.visible ? 'visible' : ''}`,
                `${workspace.urgent ? 'urgent' : ''}`,
            ],
        }),
    ),
);

// ...

// SCRATCHPAD
function getScratchWindowsCount(): number {
    let tree: TreeNode = JSON.parse(exec('i3-msg -t get_tree -r'));

    let nodes = tree.nodes?.filter((n) => n.name == '__i3')[0]?.nodes;
    let floatingNodes = nodes?.filter((n) => n.name == '__i3_scratch')[0]
        ?.floating_nodes;

    return floatingNodes ? floatingNodes.length : 0;
}

const swayScratchpad = Variable(getScratchWindowsCount(), {
    listen: [`i3-msg -t subscribe '["window"]' -m -r`, getScratchWindowsCount],
});

const showScratchpad = Variable(false);
const showScratchpadFixed = Variable(false);

function shouldRevealScratchpad(): boolean {
    return (
        showScratchpad.value ||
        showScratchpadFixed.value ||
        swayScratchpad.value > 0
    );
}

function updateScratchpadClasses(obj: Connectable<AgsButton> & AgsButton) {
    obj.toggleClassName('fixed-hover', shouldRevealScratchpad());
}

const Scratchpad = Widget.Button({
    on_primary_click: () => execAsync('swaymsg scratchpad show'),
    on_secondary_click: () => execAsync('swaymsg move scratchpad'),
    class_names: ['widget'],
    child: Widget.Box({
        class_names: ['scratchpad'],
        children: [
            Widget.Label({ label: config.scratchpad.icon }),
            Widget.Revealer({
                class_names: ['revealer'],
                transition: 'slide_right',
                transition_duration: 500,
                child: Widget.Label().bind(
                    'label',
                    swayScratchpad,
                    'value',
                    (scratchCount) => `${scratchCount}`,
                ),
            })
                .bind(
                    'reveal_child',
                    showScratchpad,
                    'value',
                    shouldRevealScratchpad,
                )
                .bind(
                    'reveal_child',
                    showScratchpadFixed,
                    'value',
                    shouldRevealScratchpad,
                )
                .bind(
                    'reveal_child',
                    swayScratchpad,
                    'value',
                    shouldRevealScratchpad,
                ),
        ],
    }),
})
    .hook(swayScratchpad, updateScratchpadClasses)
    .hook(showScratchpad, updateScratchpadClasses)
    .hook(showScratchpadFixed, updateScratchpadClasses);

// ...

// MODE

const swayMode: Variable_t<mode_t> = Variable(
    JSON.parse(await execAsync('i3-msg -t get_binding_state -r')),
    {
        listen: [
            `i3-msg -t subscribe "['mode']" -m -r`,
            (out) => ({ name: JSON.parse(out).change }),
        ],
    },
);

const Mode = Widget.Revealer({
    transition_duration: 500,
    transition: 'slide_right',
    child: Widget.Button({
        on_clicked: () => execAsync('swaymsg mode default'),
        child: Widget.Label().hook(swayMode, (self) => {
            const mode = swayMode.value.name;
            if (mode !== 'default') self.label = mode;
        }),
        class_names: ['widget', 'mode'],
    }).hook(swayMode, (self) => {
        const oldMode = self.class_names.find((m) => m.startsWith('mode_'));
        self.toggleClassName(`mode_${swayMode.value.name}`, true);
        if (oldMode) self.toggleClassName(oldMode, false);
    }),
}).bind('revealChild', swayMode, 'value', (v) => v.name !== 'default');

// ...

// CLOCK

const time = Variable('', {
    poll: [1000, () => format(new Date(), config.clock.time)],
});

const date = Variable('', {
    poll: [1000, () => format(new Date(), config.clock.date)],
});

const Clock = Widget.Label({
    class_names: ['clock', 'widget'],
})
    .bind('label', time)
    .bind('tooltip_markup', date, 'value');

// ...

// TRAY

const SysTray = Widget.Box({
    class_names: ['widget', 'tray'],
}).hook(SystemTray, (self) => {
    self.children = SystemTray.items
        .sort((a, b) => (a.title > b.title ? -1 : 1))
        .map((item) =>
            Widget.Button({
                child: Widget.Icon().bind('icon', item, 'icon'),
                on_primary_click: (_, e) => item.activate(e),
                on_secondary_click: (_, e) => item.openMenu(e),
            }).bind('tooltip_markup', item, 'tooltip_markup'),
        );
});

// ...

// LANGUAGE

function getActiveLayoutName(): string {
    const inputs: InputDevice[] = JSON.parse(exec('swaymsg -t get_inputs -r'));
    const layout = inputs.filter(
        (i) => i.type === 'keyboard' && i.xkb_layout_names,
    )[0]?.xkb_active_layout_name;
    return layout || '';
}

const inputEvent: Variable_t<XkbLayoutChange> = Variable(
    {},
    {
        listen: [
            `i3-msg -t subscribe '["input"]' -m -r`,
            (out) => JSON.parse(out),
        ],
    },
);

inputEvent.connect('changed', ({ value }) => {
    if (value.change === 'xkb_layout') {
        const currentLayout = value.input.xkb_active_layout_name;
        if (currentLayout !== lang.value) {
            lang.value = currentLayout;
        }
    }
});

const lang = Variable(getActiveLayoutName());

const Language = Widget.Button({
    on_clicked: () =>
        execAsync('swaymsg input type:keyboard xkb_switch_layout next'),
    class_names: ['widget'],
    child: Widget.Label()
        .bind('label', lang, 'value', (v) => config.language.icons[v] || v)
        .bind('tooltip_text', lang),
});

// ...

// TEMPERATURE

const TEMPERATURE = Variable(0, {
    poll: [
        config.temperature.interval,
        () => parseInt(readFile(config.temperature.path).trim()) / 1000,
    ],
});

const showTemperature = Variable(false);
const showTemperatureFixed = Variable(false);

function revealTemp() {
    return showTemperature.value || showTemperatureFixed.value;
}

function updateTempClasses(obj: Connectable<AgsButton> & AgsButton) {
    obj.toggleClassName(
        'fixed-hover',
        showTemperature.value || showTemperatureFixed.value,
    );

    obj.toggleClassName('urgent', TEMPERATURE.value > config.temperature.max);
}

const Temperature = Widget.Button({
    on_hover: () => (showTemperature.value = true),
    on_hover_lost: () => (showTemperature.value = false),
    on_middle_click: () =>
        (showTemperatureFixed.value = !showTemperatureFixed.value),
    class_names: ['widget'],
    child: Widget.Box({
        class_names: ['temp'],
        children: [
            Widget.Label().bind('label', TEMPERATURE, 'value', (v) =>
                getIconFromArray(
                    // @ts-ignore
                    config.temperature.icons,
                    v,
                    config.temperature.min,
                    config.temperature.max,
                ),
            ),
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
                .bind('reveal_child', showTemperature, 'value', revealTemp)
                .bind(
                    'reveal_child',
                    showTemperatureFixed,
                    'value',
                    revealTemp,
                ),
        ],
    }),
})
    .hook(showTemperature, updateTempClasses)
    .hook(showTemperatureFixed, updateTempClasses)
    .hook(TEMPERATURE, updateTempClasses);

// ...

// MEMORY

type mem_t = {
    type: string;
    total: number;
    used: number;
    free: number;
    shared?: number;
    buffers?: number;
    cache?: number;
    available?: number;
};

const MEMORY: Variable_t<mem_t[]> = Variable([], {
    poll: [config.memory.interval, () => JSON.parse(exec('jc free -tvw --si'))],
});

const showMemory = Variable(false);
const showMemoryFixed = Variable(false);

function revealMem() {
    return showMemory.value || showMemoryFixed.value;
}

function updateMemoryClasses(obj: Connectable<AgsButton> & AgsButton) {
    obj.toggleClassName('fixed-hover', revealMem());

    obj.toggleClassName(
        'urgent',
        getMemoryPercentage(MEMORY.value, 'Mem') > config.memory.alert,
    );
}

function getMemoryPercentage(memoryData: mem_t[], type: string) {
    const mem = memoryData.find((o) => o.type === type);
    if (mem) {
        return (mem.used / mem.total) * 100;
    } else {
        console.error(`Can't find ${type}!!!`);
        return 0;
    }
}

function createMemoryProgressBar(type: string) {
    return Widget.ProgressBar({
        vertical: true,
        inverted: true,
        class_names: ['progress', 'vertical'],
    }).bind(
        'value',
        MEMORY,
        'value',
        (v) => getMemoryPercentage(v, type) / 100,
    );
}

const Memory = Widget.Button({
    on_hover: () => (showMemory.value = true),
    on_hover_lost: () => (showMemory.value = false),
    on_middle_click: () => (showMemoryFixed.value = !showMemoryFixed.value),
    class_names: ['widget'],
    child: Widget.Box({
        class_names: ['memory'],
        children: [
            Widget.Label({ label: config.memory.icon }),
            Widget.Revealer({
                transition: 'slide_right',
                transition_duration: 500,
                class_names: ['revealer'],
                child: Widget.Box({
                    children: [
                        createMemoryProgressBar('Mem'),
                        createMemoryProgressBar('Swap'),
                    ],
                }),
            })
                .bind('reveal_child', showMemory, 'value', revealMem)
                .bind('reveal_child', showMemoryFixed, 'value', revealMem),
        ],
    }),
})
    .hook(showMemory, updateMemoryClasses)
    .hook(showMemoryFixed, updateMemoryClasses)
    .hook(MEMORY, updateMemoryClasses);

// ...

// CPU

const cpu = Variable(wrapMpstat(exec('jc mpstat -P ALL')), {
    poll: [
        config.cpu.interval,
        `jc mpstat -P ALL ${config.cpu.interval / 1000} 1`,
        (out) => wrapMpstat(out),
    ],
});

const showCpuCores = Variable(false);
const showCpuCoresFixed = Variable(false);

function revealCPU() {
    return showCpuCores.value || showCpuCoresFixed.value;
}

function updateCPUClasses(obj: Connectable<AgsButton> & AgsButton) {
    obj.toggleClassName('fixed-hover', revealCPU());

    obj.toggleClassName(
        'urgent',
        100 - cpu.value.avg.percent_idle > config.cpu.alert,
    );
}

const CPU = Widget.Button({
    on_hover: () => (showCpuCores.value = true),
    on_hover_lost: () => (showCpuCores.value = false),
    on_middle_click: () => (showCpuCoresFixed.value = !showCpuCoresFixed.value),
    on_clicked: () => term('btop'),
    class_names: ['widget'],
    child: Widget.Box({
        class_names: ['cpu'],
        children: [
            Widget.Label({ label: config.cpu.icon }),
            Widget.Revealer({
                class_names: ['revealer'],
                transition: 'slide_right',
                transition_duration: 500,
                child: Widget.Box({
                    children: cpu.value.cores.map((core) =>
                        Widget.ProgressBar({
                            vertical: true,
                            inverted: true,
                            class_names: ['progress', 'vertical'],
                        }).bind(
                            'value',
                            cpu,
                            'value',
                            (cpuStat) =>
                                (100 -
                                    cpuStat.cores[parseInt(core.cpu)]
                                        .percent_idle) /
                                100,
                        ),
                    ),
                }),
            })
                .bind('reveal_child', showCpuCores, 'value', revealCPU)
                .bind('reveal_child', showCpuCoresFixed, 'value', revealCPU),
        ],
    }),
})
    .hook(showCpuCores, updateCPUClasses)
    .hook(showCpuCoresFixed, updateCPUClasses)
    .hook(cpu, updateCPUClasses);

// ...

// BRIGHTNESS

const showBrightness = Variable(false);
const showBrightnessFixed = Variable(false);

function revealBrightness() {
    return showBrightness.value || showBrightnessFixed.value;
}

function updateBrightnessClasses(obj: Connectable<AgsButton> & AgsButton) {
    obj.toggleClassName('fixed-hover', revealBrightness());
}

const Brightness = Widget.Button({
    on_hover: () => (showBrightness.value = true),
    on_hover_lost: () => (showBrightness.value = false),
    on_middle_click: () =>
        (showBrightnessFixed.value = !showBrightnessFixed.value),
    on_scroll_up: () => execAsync('brightnessctl -e s 1-%'),
    on_scroll_down: () => execAsync('brightnessctl -e s 1+%'),
    child: Widget.Box({
        class_names: ['brightness'],
        children: [
            Widget.Label({ label: config.brightness.icon }),
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
                .bind('reveal_child', showBrightness, 'value', revealBrightness)
                .bind(
                    'reveal_child',
                    showBrightnessFixed,
                    'value',
                    revealBrightness,
                ),
        ],
    }),
})
    .bind('visible', brightness, 'screen_value', (v) => v < 1)
    .hook(showBrightness, updateBrightnessClasses)
    .hook(showBrightnessFixed, updateBrightnessClasses);

// ...

// VOLUME

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

const showPulseaudioFixed = Variable(false);
const showPulseaudio = Variable(false);

function revealVol() {
    const hovered = showPulseaudio.value;
    const show = showPulseaudioFixed.value;
    const vol = VOLUME.value['sink']['volume'];
    return (hovered || show) && vol > 0;
}

function updateVolumeClasses(obj: Connectable<AgsButton> & AgsButton) {
    obj.toggleClassName('fixed-hover', revealVol());

    obj.toggleClassName('urgent', Math.round(VOLUME.value.sink.volume) > 100);

    obj.toggleClassName('disabled', VOLUME.value.sink.mute);
}

const Volume = Widget.Button({
    on_clicked: () => execAsync('pactl set-sink-mute @DEFAULT_SINK@ toggle'),
    // on_: () => term('/home/god/rsmixer/target/release/rsmixer'),
    on_middle_click: () =>
        (showPulseaudioFixed.value = !showPulseaudioFixed.value),
    on_hover: () => (showPulseaudio.value = true),
    on_hover_lost: () => (showPulseaudio.value = false),
    class_names: ['widget'],
    child: Widget.Box({
        spacing: 2,
        class_names: ['pulseaudio'],
        children: [
            Widget.Label({ label: config.volume.bluetooth }).bind(
                'visible',
                VOLUME,
                'value',
                (v) => v['sink']['bluez'],
            ),
            Widget.Label().bind('label', VOLUME, 'value', (v) => {
                if (v['sink']['mute']) {
                    return config.volume.muted;
                }

                const vol = Math.round(v['sink']['volume']);
                if (vol === 0) {
                    return config.volume.silent;
                }
                if (vol > 100) {
                    return config.volume.alert;
                }
                return getIconFromArray(
                    // @ts-ignore
                    config.volume.icons,
                    vol,
                );
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
                .bind('revealChild', VOLUME, 'value', revealVol)
                .bind('revealChild', showPulseaudio, 'value', revealVol)
                .bind('revealChild', showPulseaudioFixed, 'value', revealVol),
            Widget.Box({
                children: [
                    Widget.Label({ label: config.volume.bluetooth }).bind(
                        'visible',
                        VOLUME,
                        'value',
                        (v) => v['source']['bluez'],
                    ),
                    Widget.Label({ label: config.volume.mic }),
                ],
            }).bind('visible', VOLUME, 'value', (v) => !v['source']['mute']),
        ],
    }),
})
    .hook(showPulseaudio, updateVolumeClasses)
    .hook(showPulseaudioFixed, updateVolumeClasses)
    .hook(VOLUME, updateVolumeClasses);

// ...

// NETWORK

// TODO wait for jc `1.25.x` build
// then we can jc iwconfig wlna0
const NETWORK: Variable_t<null | number> = Variable(null, {
    poll: [
        2000,
        `jc iw dev ${config.network.interface} link`,
        (out) => {
            let data = JSON.parse(out);
            if (data.length === 0) return null;

            return Math.round(1.2 * (data[0].signal_dbm + 100));
        },
    ],
});

const showNetwork = Variable(false);
const showNetworkFixed = Variable(false);

function revealNet() {
    return showNetwork.value || showNetworkFixed.value;
}

function updateNetworkClasses(obj: Connectable<AgsButton> & AgsButton) {
    obj.toggleClassName('fixed-hover', revealNet());

    obj.toggleClassName('disabled', NETWORK.value === null);
}

const Network = Widget.Button({
    on_secondary_click: () => term('bluetuith'),
    on_middle_click: () => (showNetworkFixed.value = !showNetworkFixed.value),
    on_hover: () => (showNetwork.value = true),
    on_hover_lost: () => (showNetwork.value = false),
    class_names: ['widget'],
    child: Widget.Box({
        class_names: ['network'],
        children: [
            Widget.Label().bind('label', NETWORK, 'value', (v) =>
                v === null
                    ? config.network.disabled
                    : getIconFromArray(
                          // @ts-ignore
                          config.network.icons,
                          v,
                      ),
            ),
            Widget.Revealer({
                transition: 'slide_right',
                transition_duration: 500,
                class_names: ['revealer'],
                child: Widget.Label().bind('label', NETWORK, 'value', (v) =>
                    v !== null ? `${v}%` : '',
                ),
            })
                .bind('reveal_child', showNetwork, 'value', revealNet)
                .bind('reveal_child', showNetworkFixed, 'value', revealNet)
                .bind('visible', NETWORK, 'value', (v) => v !== null),
        ],
    }),
})
    .hook(showNetwork, updateNetworkClasses)
    .hook(showNetworkFixed, updateNetworkClasses)
    .hook(NETWORK, updateNetworkClasses);

// ...

// BATTERY

const showBattery = Variable(false);
const showBatteryFixed = Variable(false);

function revealBat() {
    return showBattery.value || showBatteryFixed.value;
}

function updateBatteryClasses(obj: Connectable<AgsButton> & AgsButton) {
    obj.toggleClassName('fixed-hover', revealBat());

    obj.toggleClassName(
        'urgent',
        battery.percent <= config.battery.alert && !battery.charging,
    );
}

const Battery = Widget.Button({
    on_hover: () => (showBattery.value = true),
    on_hover_lost: () => (showBattery.value = false),
    on_middle_click: () => (showBatteryFixed.value = !showBatteryFixed.value),
    class_names: ['widget'],
    child: Widget.Box({
        class_names: ['battery'],
        children: [
            Widget.Label().hook(battery, (self) => {
                if (battery.charging) {
                    self.label = config.battery.charging;
                    return;
                }

                self.label = getIconFromArray(
                    // @ts-ignore
                    config.battery.icons,
                    battery.percent,
                );
            }),
            Widget.Revealer({
                transition: 'slide_right',
                transition_duration: 500,
                class_names: ['revealer'],
                child: Widget.Label().bind(
                    'label',
                    battery,
                    'percent',
                    (v) => `${Math.round(v)}%`,
                ),
            })
                .bind('reveal_child', showBattery, 'value', revealBat)
                .bind('reveal_child', showBatteryFixed, 'value', revealBat),
        ],
    }),
})
    .hook(showBattery, updateBatteryClasses)
    .hook(showBatteryFixed, updateBatteryClasses)
    .hook(battery, updateBatteryClasses);

// ...

const Left = Widget.Box({
    class_names: ['modules-left'],
    children: [Workspaces, Scratchpad, Mode],
});

const Center = Widget.Box({
    class_names: ['modules-center'],
    children: [Clock],
});

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
    style: config.CSS.paths.css,
    windows: [Bar()],
};
