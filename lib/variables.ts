import { exec, readFile } from 'resource:///com/github/Aylur/ags/utils.js';
import Variable from 'resource:///com/github/Aylur/ags/variable.js';
import conf from 'ags';
import { wrapMpstat } from 'lib/utils';
import GLib from 'gi://GLib';
import { Variable as Var } from 'types/variable';

// ...

export const bus_name = App.get_dbus_object_path()?.split('/').slice(-1)[0];

// ...

export const mode = Variable('');

// @ts-ignore
export const urgent_window_address: Var<undefined | string> =
    Variable(undefined);
// @ts-ignore
export const urgent_workspace_id: Var<undefined | number> = Variable(undefined);

// ...

const get_time = () => GLib.DateTime.new_now_local();

export const clock = Variable(get_time(), {
    poll: [1000, () => get_time()],
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

export const MEMORY: Var<mem_t[]> = Variable([], {
    poll: [conf.memory.interval, () => JSON.parse(exec('jc free -tvw --si'))],
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

export const showPulseaudioFixed = Variable(false);
export const showPulseaudio = Variable(false);

// ...

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
