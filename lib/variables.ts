import { format } from 'date-fns';
import { exec, readFile } from 'resource:///com/github/Aylur/ags/utils.js';
import Variable from 'resource:///com/github/Aylur/ags/variable.js';
import { Variable as Variable_t } from 'types/variable';
import configs from 'ts/config';
import { wrapMpstat } from 'lib/utils';

export const mode = Variable('');

// ...

export const time = Variable('', {
    poll: [1000, () => format(new Date(), configs.clock.time)],
});

export const date = Variable('', {
    poll: [1000, () => format(new Date(), configs.clock.date)],
});

// ...

export const lang = Variable('');

// ...

export const TEMPERATURE = Variable(0, {
    poll: [
        configs.temperature.interval,
        () => parseInt(readFile(configs.temperature.path).trim()) / 1000,
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

export const MEMORY: Variable_t<mem_t[]> = Variable([], {
    poll: [
        configs.memory.interval,
        () => JSON.parse(exec('jc free -tvw --si')),
    ],
});

export const showMemory = Variable(false);
export const showMemoryFixed = Variable(false);

// ...

export const cpu = Variable(wrapMpstat(exec('jc mpstat -P ALL')), {
    poll: [
        configs.cpu.interval,
        `jc mpstat -P ALL ${configs.cpu.interval / 1000} 1`,
        (out) => wrapMpstat(out),
    ],
});

export const showCpuCores = Variable(false);
export const showCpuCoresFixed = Variable(false);

// ...

export const showBrightness = Variable(false);
export const showBrightnessFixed = Variable(false);

// ...

// TODO wait for jc `1.25.x` build
// then we can jc iwconfig wlna0
export const NETWORK: Variable_t<null | number> = Variable(null, {
    poll: [
        2000,
        `jc iw dev ${configs.network.interface} link`,
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

// ...
