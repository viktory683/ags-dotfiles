import css from 'style/style';
import lowBattery from 'lib/battery';
import hyprland from 'lib/hyprland';
import updatesNotification from 'lib/updates';

export async function init() {
    try {
        css();
        lowBattery();
        hyprland();
        updatesNotification();
        // ...
    } catch (error) {
        console.error(error); // logError
    }
}
