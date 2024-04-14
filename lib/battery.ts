import battery from 'resource:///com/github/Aylur/ags/service/battery.js';
import Utils from 'resource:///com/github/Aylur/ags/utils.js';
import conf from 'ags';
import { ignore_battery } from './variables';

export default async function init() {
    battery.connect('notify::percent', ({ percent, charging }) => {
        let { low, critical_low } = conf.battery;
        if (percent > low) ignore_battery.value = false;
        if (
            percent > low ||
            charging ||
            (ignore_battery.value && percent > critical_low)
        )
            return;

        Utils.notify({
            summary: `${percent}% Battery Percentage`,
            iconName: 'battery-empty-symbolic',
            urgency: 'critical',
            actions: {
                Игнорировать: () => (ignore_battery.value = true),
            },
        });
    });
}
