// @ts-ignore
import { exec } from 'resource:///com/github/Aylur/ags/utils.js';

import { scss_path as scss, css_path as css } from './defaults.js';

export function reloadCss() {
    // const scss = `${App.configDir}/scss/style.scss`;
    // const css = `${App.configDir}/style.css`;

    exec(`sassc ${scss} ${css}`);

    return css;
}

export function getIconByPercentage(icons, percentage, max_percentage = 100) {
    // Split the icon string into an array of icons
    let icons_array = Array.isArray(icons) ? icons : icons.split('');

    // Ensure the percentage is within the valid range (0 to 100)
    percentage = Math.max(0, Math.min(max_percentage, percentage));

    // Calculate the index based on the percentage
    const index = Math.floor((percentage / max_percentage) * icons_array.length);

    // Get the icon at the calculated index
    const selectedIcon = icons_array[index];

    return selectedIcon;
}