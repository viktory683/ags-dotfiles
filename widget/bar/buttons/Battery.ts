import { showBattery, showBatteryFixed } from 'lib/variables';
import battery from 'resource:///com/github/Aylur/ags/service/battery.js';
import { getIconFromArray } from 'lib/utils';
import configs from 'ts/config';

const shouldRevealBat = () => showBattery.value || showBatteryFixed.value;

function revealBat(obj) {
    obj.reveal_child = shouldRevealBat();
}

function updateBatteryClasses(obj) {
    obj.toggleClassName('fixed-hover', shouldRevealBat());

    obj.toggleClassName(
        'urgent',
        battery.percent <= configs.battery.alert && !battery.charging,
    );
}

export default () =>
    Widget.Button({
        on_hover: () => (showBattery.value = true),
        on_hover_lost: () => (showBattery.value = false),
        on_middle_click: () =>
            (showBatteryFixed.value = !showBatteryFixed.value),
        class_names: ['widget'],
        child: Widget.Box({
            class_names: ['battery'],
            children: [
                Widget.Label().hook(battery, (self) => {
                    if (battery.charging) {
                        self.label = configs.battery.charging;
                        return;
                    }

                    self.label = getIconFromArray(
                        // @ts-ignore
                        configs.battery.icons,
                        battery.percent,
                    );
                }),
                Widget.Revealer({
                    transition: 'slide_right',
                    transition_duration: 500,
                    class_names: ['revealer'],
                    child: Widget.Label({
                        label: battery
                            .bind('percent')
                            .as((v) => `${Math.round(v)}%`),
                    }),
                })
                    .hook(showBattery, revealBat)
                    .hook(showBatteryFixed, revealBat),
            ],
        }),
    })
        .hook(showBattery, updateBatteryClasses)
        .hook(showBatteryFixed, updateBatteryClasses)
        .hook(battery, updateBatteryClasses);