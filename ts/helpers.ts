import { execAsync } from 'resource:///com/github/Aylur/ags/utils.js';
import config from './config';
import App from 'resource:///com/github/Aylur/ags/app.js';

/**
 * Reloads the CSS by compiling SCSS to CSS.
 */
export function reloadCSS() {
    execAsync(`sassc ${config.CSS.paths.scss} ${config.CSS.paths.css}`)
        .then(() => {
            App.resetCss();
            App.applyCss(config.CSS.paths.css);
            if (config.log.level == 'debug') console.log('CSS UPDATED');
        })
        .catch((err) => console.error(err));
}

/**
 * Maps a value from one range to another.
 * @param {number} x - The input value to be mapped.
 * @param {number} in_min - The minimum value of the input range.
 * @param {number} in_max - The maximum value of the input range.
 * @param {number} out_min - The minimum value of the output range.
 * @param {number} out_max - The maximum value of the output range.
 * @returns {number} - The mapped value in the output range.
 */
export function map(
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
    return execAsync(`${config.term_launch} ${command}`);
}

/**
 * Removes an item from an array.
 * @template T - The type of elements in the array.
 * @param {T[]} arr - Array from which to remove an item.
 * @param {T} value - Item to remove.
 * @returns {T[]} - Array without the specified item.
 */
function removeItem<T>(arr: T[], value: T): T[] {
    const index = arr.indexOf(value);
    if (index > -1) {
        arr.splice(index, 1);
    }
    return arr;
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

/**
 * Update the array of class names based on a specified condition.
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
