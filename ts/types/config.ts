import * as t from 'io-ts';
import { fromNullable } from 'io-ts-types';

// TODO add some default values
export const Config = t.type({
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
    }),

    memory: t.type({
        icon: t.string,
        alert: t.number,
    }),

    cpu: t.type({
        icon: t.string,
        alert: t.number,
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

    player: t.type({
        states: t.type({
            Playing: t.string,
            Paused: t.string,
            Stopped: t.string,
        }),
        shuffle: t.string,
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

    CSS: t.type({
        paths: t.type({
            scss: t.string,
            css: t.string,
        }),
    }),

    clock: t.type({
        time: t.string,
        date: t.string,
    }),
});

export type Config_t = t.TypeOf<typeof Config>;