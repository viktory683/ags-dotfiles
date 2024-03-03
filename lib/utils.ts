import Gtk from 'gi://Gtk?version=3.0';
import Gdk from 'gi://Gdk';
import Utils from 'resource:///com/github/Aylur/ags/utils.js';
import conf from 'ags';

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

/**
 * Gets an icon from an array based on a percentage value within a specified range.
 * @template T - The type of elements in the array.
 * @param {T[]} icons - The array of icons.
 * @param {number} value - The percentage value.
 * @param {number} [min=0] - The minimum percentage value.
 * @param {number} [max=100] - The maximum percentage value.
 * @returns {T} - The selected icon from the array.
 */
export function getIconFromArray<T>(
    icons: T[],
    value: number,
    min: number = 0,
    max: number = 100,
): T {
    /**
     * Maps a value from one range to another.
     * @param {number} x - The input value to be mapped.
     * @param {number} in_min - The minimum value of the input range.
     * @param {number} in_max - The maximum value of the input range.
     * @param {number} out_min - The minimum value of the output range.
     * @param {number} out_max - The maximum value of the output range.
     * @returns {number} - The mapped value in the output range.
     */
    function map(
        x: number,
        in_min: number,
        in_max: number,
        out_min: number,
        out_max: number,
    ): number {
        return (
            ((x - in_min) * (out_max - out_min)) / (in_max - in_min) + out_min
        );
    }

    let index = Math.floor(map(value, min, max, 0, icons.length));
    index = Math.max(0, Math.min(icons.length - 1, index));
    return icons[index];
}

/**
 * Launches a command in the terminal.
 * @param {string} command - Command and args to execute.
 * @returns {Promise<string>} - A promise resolving to the command output.
 */
export async function term(command: string): Promise<string> {
    return sh(`${conf.term_launch} ${command}`);
}

/**
 * `mpstat` wrapper.
 * @param {string} out - Output of `mpstat` in JSON.
 * @returns {object} - Wrapped `mpstat` data.
 */
export function wrapMpstat(out: string): { avg: any; cores: any[] } {
    const parsedData = JSON.parse(out);

    return {
        avg: parsedData.find(
            (core: { time: string | undefined; cpu: string }) =>
                core.time && core.cpu === 'all',
        ),
        cores: parsedData
            .filter(
                (core: { time: string; cpu: string }) =>
                    core.time && core.cpu !== 'all',
            )
            .sort(
                (coreA: { cpu: string }, coreB: { cpu: string }) =>
                    parseInt(coreA.cpu) - parseInt(coreB.cpu),
            ),
    };
}
