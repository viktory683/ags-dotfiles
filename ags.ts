import App from 'resource:///com/github/Aylur/ags/app.js';
import { readFile } from 'resource:///com/github/Aylur/ags/utils.js';
import * as toml from 'toml';
import { PathReporter } from 'io-ts/PathReporter';
import { isLeft } from 'fp-ts/lib/Either';
import * as t from 'io-ts';

const rawConfig = readFile(`${App.configDir}/ags.toml`);
let parsed = toml.parse(rawConfig);

// TODO add some default values
const Config = t.type({
    term_launch: t.string, // default to search for term

    battery: t.type({
        icons: t.union([t.string, t.array(t.string)]),
        charging: t.string,
        alert: t.number,
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

decodedConfig.style.paths.css = `${App.configDir}${parsed.style?.paths?.css}`;
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

// ...

export default decodedConfig;
