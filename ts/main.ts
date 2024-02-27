import battery from 'resource:///com/github/Aylur/ags/service/battery.js';
import {
    exec,
    execAsync,
    monitorFile,
    readFile,
} from 'resource:///com/github/Aylur/ags/utils.js';
import Variable from 'resource:///com/github/Aylur/ags/variable.js';
import Widget from 'resource:///com/github/Aylur/ags/widget.js';
import SystemTray from 'resource:///com/github/Aylur/ags/service/systemtray.js';
import { Variable as Variable_t } from 'types/variable';
import config from './config';
import {
    getIconByPercentage as getIconFromArray,
    reloadCSS,
    term,
    wrapMpstat,
} from './helpers';
import brightness from './service/brightness';
import { format } from 'date-fns';
import Hyprland from 'resource:///com/github/Aylur/ags/service/hyprland.js';

// CSS UPDATE

reloadCSS();

monitorFile(config.CSS.paths.scss, (_, event) => {
    if (event != 1) return;
    reloadCSS();
});

// ..

// WORKSPACES

Hyprland.connect('urgent-window', (_, windowaddress) => {
    console.log(windowaddress);
});

const dispatch = (ws: string | number) =>
    Hyprland.messageAsync(`dispatch workspace ${ws}`);

// TODO urgent workspaces
const Workspaces = () =>
    Widget.Box({
        class_names: ['workspaces'],
        children: Array.from({ length: 12 }, (_, i) => i + 1).map((i) =>
            Widget.Button({
                on_clicked: () => dispatch(i),
                attribute: i,
                label:
                    config.workspaces.icons[`${i}`] ||
                    config.workspaces.icons['default'],
                class_names: ['workspace', 'widget'],
            }),
        ),

        setup: (self) =>
            self.hook(Hyprland, () =>
                self.children.forEach((btn) => {
                    btn.visible = Hyprland.workspaces.some(
                        (ws) => ws.id === btn.attribute,
                    );

                    btn.toggleClassName(
                        'focused',
                        Hyprland.workspaces.some(
                            (ws) =>
                                ws.id === Hyprland.active.workspace.id &&
                                ws.id === btn.attribute,
                        ),
                    );
                }),
            ),
    });

// ...

// MODE

Hyprland.connect('submap', (_, name: string) => {
    mode.value = name;
});

const mode = Variable('');

const Mode = () =>
    Widget.Revealer({
        transition_duration: 500,
        transition: 'slide_right',
        revealChild: mode.bind().as((v) => v !== ''),
        child: Widget.Button({
            on_clicked: () => execAsync('hyprctl dispatch submap reset'),
            child: Widget.Label().hook(mode, (self) => {
                if (mode.value !== '') self.label = mode.value;
            }),
            class_names: ['widget', 'mode'],
        }).hook(mode, (self) => {
            const oldMode = self.class_names.find((m) => m.startsWith('mode_'));
            self.toggleClassName(`mode_${mode.value}`, true);
            if (oldMode) self.toggleClassName(oldMode, false);
        }),
    });

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
    label: time.bind(),
    tooltip_text: date.bind(),
});

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
                tooltip_text: item.bind('tooltip_markup'),
            }),
        );
});

// ...

// LANGUAGE

const getActiveLayoutName = () =>
    JSON.parse(exec('hyprctl devices -j')).keyboards.find((kb) => kb.main)
        .active_keymap;

Hyprland.connect('keyboard-layout', (_, __, layoutname: string) => {
    lang.value = layoutname;
});

const lang = Variable(getActiveLayoutName());

const Language = () =>
    Widget.Button({
        on_clicked: () =>
            execAsync(
                'hyprctl switchxkblayout at-translated-set-2-keyboard next',
            ),
        class_names: ['widget'],
        child: Widget.Label({
            label: lang.bind().as((v) => config.language.icons[v] || v),
            tooltip_text: lang.bind(),
        }),
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

const shouldRevealTemp = () =>
    showTemperature.value || showTemperatureFixed.value;

function revealTemp(obj) {
    obj.reveal_child = shouldRevealTemp();
}

function updateTempClasses(obj) {
    obj.toggleClassName('fixed-hover', shouldRevealTemp());

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
            Widget.Label({
                label: TEMPERATURE.bind().as((v) =>
                    getIconFromArray(
                        // @ts-ignore
                        config.temperature.icons,
                        v,
                        config.temperature.min,
                        config.temperature.max,
                    ),
                ),
            }),
            Widget.Revealer({
                transition_duration: 500,
                transition: 'slide_right',
                class_names: ['revealer', 'right'],
                child: Widget.Label({
                    label: TEMPERATURE.bind().as((v) => `${v}º`),
                }),
            })
                .hook(showTemperature, revealTemp)
                .hook(showTemperatureFixed, revealTemp),
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

const shouldRevealMem = () => showMemory.value || showMemoryFixed.value;

function revealMem(obj) {
    obj.reveal_child = shouldRevealMem();
}

function updateMemoryClasses(obj) {
    obj.toggleClassName('fixed-hover', shouldRevealMem());

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
        value: MEMORY.bind().as((v) => getMemoryPercentage(v, type) / 100),
    });
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
                .hook(showMemory, revealMem)
                .hook(showMemoryFixed, revealMem),
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

const shouldRevealCPU = () => showCpuCores.value || showCpuCoresFixed.value;

function revealCPU(obj) {
    obj.reveal_child = shouldRevealCPU();
}

function updateCPUClasses(obj) {
    obj.toggleClassName('fixed-hover', shouldRevealCPU());

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
                            value: cpu
                                .bind()
                                .as(
                                    (cpuStat) =>
                                        (100 -
                                            cpuStat.cores[parseInt(core.cpu)]
                                                .percent_idle) /
                                        100,
                                ),
                        }),
                    ),
                }),
            })
                .hook(showCpuCores, revealCPU)
                .hook(showCpuCoresFixed, revealCPU),
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

const shouldRevealBrightness = () =>
    showBrightness.value || showBrightnessFixed.value;

function RevealBrightness(obj) {
    obj.reveal_child = shouldRevealBrightness();
}

function updateBrightnessClasses(obj) {
    obj.toggleClassName('fixed-hover', shouldRevealBrightness());
}

const Brightness = Widget.Button({
    on_hover: () => (showBrightness.value = true),
    on_hover_lost: () => (showBrightness.value = false),
    on_middle_click: () =>
        (showBrightnessFixed.value = !showBrightnessFixed.value),
    on_scroll_up: () => execAsync('brightnessctl -e s 1-%'),
    on_scroll_down: () => execAsync('brightnessctl -e s 1+%'),
    visible: brightness.bind('screen_value').as((v) => v < 1),
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
                    value: brightness.bind('screen_value'),
                }),
            })
                .hook(showBrightness, RevealBrightness)
                .hook(showBrightnessFixed, RevealBrightness),
        ],
    }),
})
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

const shouldRevealVol = () =>
    (showPulseaudio.value || showPulseaudioFixed.value) &&
    VOLUME.value['sink']['volume'] > 0;

function revealVol(obj) {
    obj.reveal_child = shouldRevealVol();
}

function updateVolumeClasses(obj) {
    obj.toggleClassName('fixed-hover', shouldRevealVol());

    obj.toggleClassName('urgent', Math.round(VOLUME.value.sink.volume) > 100);

    obj.toggleClassName('disabled', VOLUME.value.sink.mute);
}

const Volume = Widget.Button({
    on_clicked: () => execAsync('pactl set-sink-mute @DEFAULT_SINK@ toggle'),
    on_middle_click: () =>
        (showPulseaudioFixed.value = !showPulseaudioFixed.value),
    on_hover: () => (showPulseaudio.value = true),
    on_hover_lost: () => (showPulseaudio.value = false),
    class_names: ['widget'],
    child: Widget.Box({
        spacing: 2,
        class_names: ['pulseaudio'],
        children: [
            Widget.Label({
                label: config.volume.bluetooth,
                visible: VOLUME.bind().as((v) => v['sink']['bluez']),
            }),
            Widget.Label({
                label: VOLUME.bind().as((v) => {
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
            }),
            Widget.Revealer({
                reveal_child: false,
                transition: 'slide_right',
                class_names: ['revealer'],
                child: Widget.Label({
                    label: VOLUME.bind().as(
                        (v) => `${Math.round(v['sink']['volume'])}%`,
                    ),
                }),
            })
                .hook(VOLUME, revealVol)
                .hook(showPulseaudio, revealVol)
                .hook(showPulseaudioFixed, revealVol),
            Widget.Box({
                visible: VOLUME.bind().as((v) => !v['source']['mute']),
                children: [
                    Widget.Label({
                        label: config.volume.bluetooth,
                        visible: VOLUME.bind().as((v) => v['source']['bluez']),
                    }),
                    Widget.Label({ label: config.volume.mic }),
                ],
            }),
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

const shouldRevealNet = () => showNetwork.value || showNetworkFixed.value;

function revealNet(obj) {
    obj.reveal_child = shouldRevealNet();
}

function updateNetworkClasses(obj) {
    obj.toggleClassName('fixed-hover', shouldRevealNet());

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
            Widget.Label({
                label: NETWORK.bind().as((v) =>
                    v === null
                        ? config.network.disabled
                        : getIconFromArray(
                              // @ts-ignore
                              config.network.icons,
                              v,
                          ),
                ),
            }),
            Widget.Revealer({
                transition: 'slide_right',
                transition_duration: 500,
                class_names: ['revealer'],
                visible: NETWORK.bind().as((v) => v !== null),
                child: Widget.Label().bind('label', NETWORK, 'value', (v) =>
                    v !== null ? `${v}%` : '',
                ),
            })
                .hook(showNetwork, revealNet)
                .hook(showNetworkFixed, revealNet),
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

const shouldRevealBat = () => showBattery.value || showBatteryFixed.value;

function revealBat(obj) {
    obj.reveal_child = shouldRevealBat();
}

function updateBatteryClasses(obj) {
    obj.toggleClassName('fixed-hover', shouldRevealBat());

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
                child: Widget.Label({
                    label: battery
                        .bind('percent')
                        .as((v) => `${Math.round(v)}%`),
                }),
            })
                .hook(showBattery, revealBat)
                .hook(showBatteryFixed, revealBat),
        ],
    }),
})
    .hook(showBattery, updateBatteryClasses)
    .hook(showBatteryFixed, updateBatteryClasses)
    .hook(battery, updateBatteryClasses);

// ...

const Left = Widget.Box({
    class_names: ['modules-left'],
    children: [
        Workspaces(),
        // Scratchpad,
        Mode(),
    ],
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
        Language(),
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
        layer: 'top', // "top" by default
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
