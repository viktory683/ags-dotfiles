import battery from 'resource:///com/github/Aylur/ags/service/battery.js';
import Utils from 'resource:///com/github/Aylur/ags/utils.js';
import conf from 'ags';

export default async function init() {
    battery.connect('notify::percent', ({ percent, charging }) => {
        let low = conf.battery.alert;
        if (percent > low || charging) return;

        Utils.notify({
            summary: `${percent}% Battery Percentage`,
            iconName: 'battery-empty-symbolic',
            urgency: 'critical',
        });
    });
}
