import { exec, execAsync } from 'resource:///com/github/Aylur/ags/utils.js';
import config from './config';

export function reloadCSS() {
    // const scss = `${App.configDir}/scss/style.scss`;
    // const css = `${App.configDir}/style.css`;

    exec(`sassc ${config.CSS.paths.scss} ${config.CSS.paths.css}`);

    return config.CSS.paths.css;
}

/**
 * Maps a value from one range to another.
 *
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
    return ((x - in_min) * (out_max - out_min)) / (in_max - in_min) + out_min;
}

/**
 * Gets an icon from an array based on a percentage value within a specified range.
 *
 * @template T - The type of elements in the array.
 * @param {T[]} icons - The array of icons.
 * @param {number} value - The percentage value.
 * @param {number} [min=0] - The minimum percentage value.
 * @param {number} [max=100] - The maximum percentage value.
 * @returns {T} - The selected icon from the array.
 */
export function getIconByPercentage<T>(
    icons: T[],
    value: number,
    min: number = 0,
    max: number = 100,
): T {
    // Map the percentage value to an index within the icons array
    let index = map(value, min, max, 0, icons.length);

    // Round the index to the nearest integer
    index = Math.floor(index);

    // Ensure the index is within the valid range of array indices
    index = Math.max(0, Math.min(icons.length - 1, index));

    // Return the selected icon
    return icons[index];
}

/**
 * Launch something in terminal
 * @param command Command and args to execute
 */
export async function term(command: string): Promise<string> {
    return execAsync(`${config.term_launch} ${command}`);
}

/**
 * Remove item from array
 * @param arr Array of element where from to remove an item
 * @param value Item to remove
 * @returns Array without item
 */
export function removeItem<T>(arr: T[], value: T): T[] {
    var index = arr.indexOf(value);
    if (index > -1) {
        arr.splice(index, 1);
    }
    return arr;
}

/**
 * `mpstat` wrapper
 * @param out Output of mpstat in JSON
 */
export function wrap_mpstat(out: string) {
    return {
        avg: JSON.parse(out).filter(
            (core: { time: string | undefined; cpu: string }) =>
                core.time && core.cpu == 'all',
        )[0],
        cores: JSON.parse(out)
            .filter(
                (core: { time: string; cpu: string }) =>
                    core.time && core.cpu != 'all',
            )
            .sort(
                (coreA: { cpu: string }, coreB: { cpu: string }) =>
                    parseInt(coreA.cpu) > parseInt(coreB.cpu),
            ),
    };
}

/**
 * Update the array of class names based on a specified condition.
 *
 * @param {string[]} classNames - The current array of class names.
 * @param {string} targetClass - The class name to be added or removed.
 * @param {boolean} condition - The condition to determine whether to add or remove the class.
 * @returns {string[]} - The updated array of class names.
 */
export function updateClassNames(
    classNames: string[],
    targetClass: string,
    condition: boolean,
): string[] {
    return condition
        ? [...classNames, targetClass]
        : removeItem(classNames, targetClass);
}
