import { exec, execAsync } from 'resource:///com/github/Aylur/ags/utils.js';
import { scss_path as scss, css_path as css, term_launch } from './defaults';

export function reloadCSS() {
    // const scss = `${App.configDir}/scss/style.scss`;
    // const css = `${App.configDir}/style.css`;

    exec(`sassc ${scss} ${css}`);

    return css;
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
    return execAsync(`${term_launch} ${command}`);
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

export type Node = {
    id: number;
    name: string;
    type: 'root' | 'output' | 'con' | 'floating_con' | 'workspace' | 'dockarea';
    border: 'normal' | 'none' | 'pixel';
    current_border_width: number;
    layout: 'splith' | 'splitv' | 'stacked' | 'tabbed' | 'dockarea' | 'output';
    orientation: 'none' | 'horizontal' | 'vertical';
    percent: number | null;
    rect: { x: number; y: number; width: number; height: number };
    window_rect?: { x: number; y: number; width: number; height: number };
    deco_rect?: { x: number; y: number; width: number; height: number };
    actual_deco_rect?: { x: number; y: number; width: number; height: number };
    geometry?: { x: number; y: number; width: number; height: number };
    window?: number | null;
    window_properties?: Record<string, string>;
    window_type?:
        | 'undefined'
        | 'unknown'
        | 'normal'
        | 'dialog'
        | 'utility'
        | 'toolbar'
        | 'splash'
        | 'menu'
        | 'dropdown_menu'
        | 'popup_menu'
        | 'tooltip'
        | 'notification';
    urgent: boolean;
    marks: string[];
    focused: boolean;
    focus: number[];
    sticky: boolean;
    fullscreen_mode: 0 | 1 | 2;
    floating: 'auto_on' | 'auto_off' | 'user_on' | 'user_off';
    nodes?: Node[];
    floating_nodes?: Node[];
    scratchpad_state?: 'none' | 'fresh' | 'changed';
};

export type XkbLayoutChange = {
    change: 'xkb_layout';
    input: {
        identifier: string;
        name: string;
        vendor: number;
        product: number;
        type: 'keyboard';
        repeat_delay: number;
        repeat_rate: number;
        xkb_layout_names: string[];
        xkb_active_layout_index: number;
        xkb_active_layout_name: string;
        libinput: {
            send_events: 'enabled';
        };
    };
};

export type InputDevice = {
    identifier: string;
    name: string;
    vendor: number;
    product: number;
    type:
        | 'touchpad'
        | 'pointer'
        | 'keyboard'
        | 'touch'
        | 'tablet_tool'
        | 'tablet_pad'
        | 'switch';
    repeat_delay?: number;
    repeat_rate?: number;
    xkb_layout_names?: string[];
    xkb_active_layout_index?: number;
    xkb_active_layout_name?: string;
    scroll_factor?: number;
    libinput: {
        send_events: 'enabled';
        tap?: 'enabled';
        tap_button_map?: 'lrm';
        tap_drag?: 'enabled';
        tap_drag_lock?: 'disabled';
        accel_speed?: number;
        accel_profile?: 'adaptive';
        natural_scroll?: 'enabled' | 'disabled';
        left_handed?: 'enabled' | 'disabled';
        click_method?: 'button_areas';
        middle_emulation?: 'enabled' | 'disabled';
        scroll_method?: 'two_finger';
        dwt?: 'enabled' | 'disabled';
        dwtp?: 'enabled' | 'disabled';
        scroll_button?: number;
    };
};
