import { exec, readFile } from 'resource:///com/github/Aylur/ags/utils.js';
import Variable from 'resource:///com/github/Aylur/ags/variable.js';
import conf from 'ags';
import { wrapMpstat } from 'lib/utils';
import GLib from 'gi://GLib';

// ...

export const bus_name = App.get_dbus_object_path()?.split('/').slice(-1)[0];

// ...

export const mode = Variable('');

// ...

export const clock = Variable(GLib.DateTime.new_now_local(), {
    poll: [1000, () => GLib.DateTime.new_now_local()],
});

// ...

export const lang = Variable('');

// ...

export const TEMPERATURE = Variable(0, {
    poll: [
        conf.temperature.interval,
        () => parseInt(readFile(conf.temperature.path).trim()) / 1000,
    ],
});

export const showTemperature = Variable(false);
export const showTemperatureFixed = Variable(false);

// ...

export type mem_t = {
    type: string;
    total: number;
    used: number;
    free: number;
    shared?: number;
    buffers?: number;
    cache?: number;
    available?: number;
};

export const MEMORY = Variable([], {
    poll: [
        conf.memory.interval,
        // yes we can simply `() => JSON.parse(...)` but I did that for type hints
        () => {
            let data: mem_t[] = JSON.parse(exec('jc free -tvw --si'));
            return data;
        },
    ],
});

export const showMemory = Variable(false);
export const showMemoryFixed = Variable(false);

// ...

export const cpu = Variable(wrapMpstat(exec('jc mpstat -P ALL')), {
    poll: [
        conf.cpu.interval,
        `jc mpstat -P ALL ${conf.cpu.interval / 1000} 1`,
        (out) => wrapMpstat(out),
    ],
});

export const showCpuCores = Variable(false);
export const showCpuCoresFixed = Variable(false);

// ...

export const showBrightness = Variable(false);
export const showBrightnessFixed = Variable(false);

// ...

export const VOLUME = Variable(
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

export const showPulseaudioFixed = Variable(false);
export const showPulseaudio = Variable(false);

// ...

// TODO wait for [issue](https://github.com/kellyjonbrazil/jc/issues/541) to close and [package](https://archlinux.org/packages/extra/any/jc) to build
// then we can just `jc iwconfig wlan0`
export const NETWORK = Variable(null, {
    poll: [
        2000,
        `jc iw dev ${conf.network.interface} link`,
        (out) => {
            let data = JSON.parse(out);
            if (data.length === 0) return null;

            return Math.round(1.2 * (data[0].signal_dbm + 100));
        },
    ],
});

export const showNetwork = Variable(false);
export const showNetworkFixed = Variable(false);

// ...

export const showBattery = Variable(false);
export const showBatteryFixed = Variable(false);

export const ignore_battery = Variable(false);

// ...

export const notification = Variable(
    { text: '', alt: '', tooltip: '', class: '' },
    { listen: ['swaync-client -swb', (out) => JSON.parse(out)] },
);
