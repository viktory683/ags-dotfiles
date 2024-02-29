import { showBattery, showBatteryFixed } from 'lib/variables';
import battery from 'resource:///com/github/Aylur/ags/service/battery.js';
import { getIconFromArray } from 'lib/utils';
import conf from 'ags';
import { Box } from 'resource:///com/github/Aylur/ags/widgets/box.js';
import { Button } from 'resource:///com/github/Aylur/ags/widgets/button.js';
import { Label } from 'resource:///com/github/Aylur/ags/widgets/label.js';
import { Revealer } from 'resource:///com/github/Aylur/ags/widgets/revealer.js';

const shouldRevealBat = () => showBattery.value || showBatteryFixed.value;

function revealBat(obj: Revealer<Label<unknown>, unknown>) {
    obj.revealChild = shouldRevealBat();
}

function updateBatteryClasses(
    obj: Button<
        Box<Label<unknown> | Revealer<Label<unknown>, unknown>, unknown>,
        unknown
    >,
) {
    obj.toggleClassName('fixed-hover', shouldRevealBat());

    obj.toggleClassName(
        'urgent',
        battery.percent <= conf.battery.alert && !battery.charging,
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
                        self.label = conf.battery.charging;
                        return;
                    }

                    self.label = getIconFromArray(
                        // @ts-ignore
                        conf.battery.icons,
                        battery.percent,
                    );
                }),
                Widget.Revealer({
                    transition: 'slide_right',
                    transitionDuration: 500,
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
