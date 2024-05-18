import * as toml from 'toml';

import { isLeft } from 'fp-ts/lib/Either';
import * as t from 'io-ts';
import { PathReporter } from 'io-ts/PathReporter';

import { readFile } from 'resource:///com/github/Aylur/ags/utils.js';
import App from 'resource:///com/github/Aylur/ags/app.js';

// Определение типов для конфигурации
const Config = t.type({
    term_launch: t.string,
    term_launch_hold: t.union([t.string, t.undefined]),

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

    notifications: t.union([
        t.undefined,
        t.type({
            exclude: t.union([t.undefined, t.array(t.string)]),
        }),
    ]),

    launcher: t.type({
        iconSize: t.number,
        maxChars: t.number,
        width: t.number,
        height: t.number,
        spacing: t.number,
        placeholderText: t.string,
        clearSearchOnOpen: t.boolean,
    }),
});

export type Config_t = t.TypeOf<typeof Config>;

// Функция для чтения и валидации конфигурации
function readAndValidateConfig(): Config_t {
    const rawConfig = readFile(`${App.configDir}/ags.toml`);
    const parsed = toml.parse(rawConfig);

    const decoded = Config.decode(parsed);
    if (isLeft(decoded)) {
        throw new Error(
            `Invalid configuration: ${formatValidationError(decoded)}`,
        );
    }

    const decodedConfig: Config_t = decoded.right;

    // Пост-обработка конфигурации
    decodedConfig.style.paths.scss = `${App.configDir}${parsed.style?.paths?.scss}`;
    convertIconsToArray(decodedConfig.battery);
    convertIconsToArray(decodedConfig.temperature);
    convertIconsToArray(decodedConfig.network);
    convertIconsToArray(decodedConfig.volume);
    normalizeInterval(decodedConfig.cpu.interval);
    normalizeInterval(decodedConfig.updates.interval);

    if (decodedConfig.notifications?.exclude === undefined)
        decodedConfig.notifications = {
            exclude: [],
        };
    // decodedConfig.notifications.exclude = [];

    return decodedConfig;
}

// Функция для форматирования сообщения об ошибке валидации
function formatValidationError(decoded: t.Validation<any>): string {
    return PathReporter.report(decoded).join('\n');
}

// Функция для преобразования иконок в массив, если они указаны в виде строки
function convertIconsToArray(decodedConfigProperty: {
    icons: string[] | string;
}) {
    if (typeof decodedConfigProperty.icons === 'string') {
        decodedConfigProperty.icons = decodedConfigProperty.icons.split('');
    }
}

// Функция для нормализации интервала
function normalizeInterval(interval: number) {
    interval = Math.trunc(interval / 1000);
    if (interval <= 0) {
        throw new Error(`Interval should be greater than 1000 milliseconds`);
    }
    return interval * 1000;
}

// Чтение и валидация конфигурации при загрузке приложения
const config = readAndValidateConfig();

export default config;
