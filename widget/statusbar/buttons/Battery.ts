import { showBattery, showBatteryFixed } from 'lib/variables';
import battery from 'resource:///com/github/Aylur/ags/service/battery.js';
import { EventBox, getIconFromArray } from 'lib/utils';
import conf from 'ags';
import { Revealer } from 'resource:///com/github/Aylur/ags/widgets/revealer.js';
import Widget from 'resource:///com/github/Aylur/ags/widget.js';
import Gtk from '@girs/gtk-3.0';
import { Widget as Widget_t } from 'types/widgets/widget';

const shouldRevealBat = () => showBattery.value || showBatteryFixed.value;

function revealBat(obj: Revealer<Gtk.Widget, unknown>) {
    obj.revealChild = shouldRevealBat();
}

function updateBatteryClasses(obj: Widget_t<unknown>) {
    obj.toggleClassName('fixed-hover', shouldRevealBat());

    obj.toggleClassName(
        'urgent',
        battery.percent <= conf.battery.low && !battery.charging,
    );
}

export default () =>
    EventBox({
        on_hover: () => (showBattery.value = true),
        on_hover_lost: () => (showBattery.value = false),
        on_middle_click: () =>
            (showBatteryFixed.value = !showBatteryFixed.value),
        class_names: ['widget', 'battery'],
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
                child: Widget.Label({
                    label: battery
                        .bind('percent')
                        .as((v) => `${Math.round(v)}%`),
                }),
            })
                .hook(showBattery, revealBat)
                .hook(showBatteryFixed, revealBat),
        ],
    })
        .hook(showBattery, updateBatteryClasses)
        .hook(showBatteryFixed, updateBatteryClasses)
        .hook(battery, updateBatteryClasses);
