import { type Config } from 'types/app';
// @ts-ignore
import Gtk from 'gi://Gtk?version=3.0';
import Gdk from 'gi://Gdk';
import Utils from 'resource:///com/github/Aylur/ags/utils.js'

export function config<T extends Gtk.Window>(config: Config<T>) {
    return config;
}

export async function sh(cmd: string | string[]) {
    return Utils.execAsync(cmd).catch((err) => {
        console.error(typeof cmd === 'string' ? cmd : cmd.join(' '), err);
        return '';
    });
}

export function forMonitors(widget: (monitor: number) => Gtk.Window) {
    const n = Gdk.Display.get_default()?.get_n_monitors() || 1;
    return range(n, 0).map(widget).flat(1);
}

/**
 * @returns [start...length]
 */
export function range(length: number, start = 1) {
    return Array.from({ length }, (_, i) => i + start);
}
