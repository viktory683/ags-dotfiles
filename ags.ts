import App from 'resource:///com/github/Aylur/ags/app.js';
import { readFile } from 'resource:///com/github/Aylur/ags/utils.js';
import * as toml from 'toml';
import { PathReporter } from 'io-ts/PathReporter';
import { isLeft } from 'fp-ts/lib/Either';
import * as t from 'io-ts';

const rawConfig = readFile(`${App.configDir}/ags.toml`);
let parsed = toml.parse(rawConfig);

const Config = t.type({
    term_launch: t.string, // default to search for term
    term_launch_hold: t.union([t.string, t.undefined]), // default to search for term but without closing term

    battery: t.type({
        icons: t.union([t.string, t.array(t.string)]),
        charging: t.string,
        low: t.number,
        critical_low: t.number,
    }),

    temperature: t.type({
        icons: t.union([t.string, t.array(t.string)]),
        alert: t.string,
        min: t.number,
        max: t.number,
        path: t.string,
        interval: t.number,
    }),

    memory: t.type({
        icon: t.string,
        alert: t.number,
        interval: t.number,
    }),

    cpu: t.type({
        icon: t.string,
        alert: t.number,
        interval: t.number,
    }),

    brightness: t.type({
        icon: t.string,
    }),

    network: t.type({
        icons: t.union([t.string, t.array(t.string)]),
        disabled: t.string,
        interface: t.string,
    }),

    volume: t.type({
        icons: t.union([t.string, t.array(t.string)]),
        bluetooth: t.string,
        muted: t.string,
        silent: t.string,
        alert: t.string,
        mic: t.string,
    }),

    scratchpad: t.type({
        icon: t.string,
    }),

    workspaces: t.type({
        icons: t.record(t.string, t.string),
        default: t.string,
    }),

    notification: t.type({
        icons: t.record(t.string, t.string),
    }),

    language: t.type({
        icons: t.record(t.string, t.string),
    }),

    style: t.type({
        paths: t.type({
            scss: t.string,
            css: t.string,
        }),
    }),

    clock: t.type({
        time: t.string,
        date: t.string,
    }),

    log: t.type({
        level: t.keyof({
            info: null,
            debug: null,
        }),
    }),

    updates: t.type({
        icon: t.string,
        interval: t.number,
    }),
});

export type Config_t = t.TypeOf<typeof Config>;

const decoded = Config.decode(parsed);
if (isLeft(decoded)) {
    throw Error(
        `Could not validate data: ${PathReporter.report(decoded).join('\n')}`,
    );
    // e.g.: Could not validate data: Invalid value "foo" supplied to : { userId: number, name: string }/userId: number
}

const decodedConfig: Config_t = decoded.right;

// config post-process

decodedConfig.style.paths.scss = `${App.configDir}${parsed.style?.paths?.scss}`;

function convertIconsToArray(decodedConfigProperty: {
    icons: string[] | string;
}) {
    if (typeof decodedConfigProperty.icons === 'string') {
        decodedConfigProperty.icons = decodedConfigProperty.icons.split('');
    }
}

convertIconsToArray(decodedConfig.battery);
convertIconsToArray(decodedConfig.temperature);
convertIconsToArray(decodedConfig.network);
convertIconsToArray(decodedConfig.volume);

decodedConfig.cpu.interval = Math.trunc(decodedConfig.cpu.interval / 1000);
if (decodedConfig.cpu.interval <= 0) {
    throw Error(`decodedConfig.cpu.interval should be greater than 1000`);
}
decodedConfig.cpu.interval = decodedConfig.cpu.interval * 1000;

decodedConfig.updates.interval = Math.trunc(
    decodedConfig.updates.interval / 1000,
);
if (decodedConfig.updates.interval <= 0) {
    throw Error(`decodedConfig.updates.interval should be greater than 1000`);
}
decodedConfig.updates.interval = decodedConfig.updates.interval * 1000;
// ...

export default decodedConfig;
