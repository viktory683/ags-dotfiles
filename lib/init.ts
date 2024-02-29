import css from 'style/style';
import lowBattery from 'lib/battery';

export async function init() {
    try {
        css();
        lowBattery();
        // ...
    } catch (error) {
        console.error(error); // logError
    }
}
