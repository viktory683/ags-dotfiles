import * as toml from 'toml';
import { z } from 'zod';
import { readFile } from 'resource:///com/github/Aylur/ags/utils.js';
import App from 'resource:///com/github/Aylur/ags/app.js';

// Define the schema for configuration using zod
const ConfigSchema = z.object({
    term_launch: z.string(),
    term_launch_hold: z.string().optional(),

    battery: z.object({
        icons: z.union([z.string(), z.array(z.string())]),
        charging: z.string(),
        low: z.number(),
        critical_low: z.number(),
    }),

    temperature: z.object({
        icons: z.union([z.string(), z.array(z.string())]),
        alert: z.string(),
        min: z.number(),
        max: z.number(),
        path: z.string(),
        interval: z.number(),
    }),

    memory: z.object({
        icon: z.string(),
        alert: z.number(),
        interval: z.number(),
    }),

    cpu: z.object({
        icon: z.string(),
        alert: z.number(),
        interval: z.number(),
    }),

    brightness: z.object({
        icon: z.string(),
    }),

    network: z.object({
        icons: z.union([z.string(), z.array(z.string())]),
        disabled: z.string(),
        interface: z.string(),
    }),

    volume: z.object({
        icons: z.union([z.string(), z.array(z.string())]),
        bluetooth: z.string(),
        muted: z.string(),
        silent: z.string(),
        alert: z.string(),
        mic: z.string(),
    }),

    scratchpad: z.object({
        icon: z.string(),
    }),

    workspaces: z.object({
        icons: z.record(z.string(), z.string()),
        default: z.string(),
    }),

    notification: z.object({
        icons: z.record(z.string(), z.string()),
    }),

    language: z.object({
        icons: z.record(z.string(), z.string()),
    }),

    style: z.object({
        paths: z.object({
            scss: z.string(),
            css: z.string(),
        }),
    }),

    clock: z.object({
        time: z.string(),
        date: z.string(),
    }),

    log: z.object({
        level: z.enum(['info', 'debug']),
    }),

    updates: z.object({
        icon: z.string(),
        interval: z.number(),
    }),

    notifications: z
        .object({
            exclude: z.array(z.string()).optional(),
        })
        .optional(),

    launcher: z.object({
        iconSize: z.number(),
        maxChars: z.number(),
        width: z.number(),
        height: z.number(),
        spacing: z.number(),
        placeholderText: z.string(),
        clearSearchOnOpen: z.boolean(),
    }),
});

export type ConfigType = z.infer<typeof ConfigSchema>;

// Function to read and validate the configuration
function readAndValidateConfig(): ConfigType {
    const rawConfig = readFile(`${App.configDir}/ags.toml`);
    const parsedConfig = toml.parse(rawConfig);

    const result = ConfigSchema.safeParse(parsedConfig);
    if (!result.success) {
        throw new Error(`Invalid configuration: ${result.error.message}`);
    }

    const config = result.data;

    // Post-process the configuration
    config.style.paths.scss = `${App.configDir}${config.style.paths.scss}`;

    const iconFields = [
        'battery.icons',
        'temperature.icons',
        'network.icons',
        'volume.icons',
    ];
    iconFields.forEach((field) => {
        const keys = field.split('.');
        config[keys[0]][keys[1]] = convertIconsToArray(
            config[keys[0]][keys[1]],
        );
    });

    config.cpu.interval = normalizeInterval(config.cpu.interval);
    config.updates.interval = normalizeInterval(config.updates.interval);

    config.notifications = config.notifications || { exclude: [] };

    return config;
}

// Function to convert icons to array if they are in string format
function convertIconsToArray(icons: string | string[]): string[] {
    return typeof icons === 'string' ? icons.split('') : icons;
}

// Function to normalize interval
function normalizeInterval(interval: number): number {
    const normalized = Math.trunc(interval / 1000) * 1000;
    if (normalized <= 1000) {
        throw new Error('Interval should be greater than 1000 milliseconds');
    }
    return normalized;
}

// Read and validate configuration on application load
const config = readAndValidateConfig();

export default config;
