import css from 'style/style';
import lowBattery from 'lib/battery';
import hyprland from 'lib/hyprland';

export async function init() {
    try {
        css();
        lowBattery();
        hyprland();
        // ...
    } catch (error) {
        console.error(error); // logError
    }
}
