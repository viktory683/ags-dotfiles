import {
    TEMPERATURE,
    showTemperature,
    showTemperatureFixed,
} from 'lib/variables';
import Widget from 'resource:///com/github/Aylur/ags/widget.js';
import conf from 'ags';
import { getIconFromArray } from 'lib/utils';
import { Label } from 'resource:///com/github/Aylur/ags/widgets/label.js';
import { Revealer } from 'resource:///com/github/Aylur/ags/widgets/revealer.js';
import { Box } from 'resource:///com/github/Aylur/ags/widgets/box.js';
import { Button } from 'resource:///com/github/Aylur/ags/widgets/button.js';

const shouldRevealTemp = () =>
    showTemperature.value || showTemperatureFixed.value;

function revealTemp(obj: Revealer<Label<unknown>, unknown>) {
    obj.revealChild = shouldRevealTemp();
}

function updateTempClasses(
    obj: Button<
        Box<Label<unknown> | Revealer<Label<unknown>, unknown>, unknown>,
        unknown
    >,
) {
    obj.toggleClassName('fixed-hover', shouldRevealTemp());

    obj.toggleClassName('urgent', TEMPERATURE.value > conf.temperature.max);
}

export default () =>
    Widget.Button({
        on_hover: () => (showTemperature.value = true),
        on_hover_lost: () => (showTemperature.value = false),
        on_middle_click: () =>
            (showTemperatureFixed.value = !showTemperatureFixed.value),
        class_names: ['widget'],
        child: Widget.Box({
            class_names: ['temp'],
            children: [
                Widget.Label({
                    label: TEMPERATURE.bind().as((v) =>
                        getIconFromArray(
                            // @ts-ignore
                            conf.temperature.icons,
                            v,
                            conf.temperature.min,
                            conf.temperature.max,
                        ),
                    ),
                }),
                Widget.Revealer({
                    transitionDuration: 500,
                    transition: 'slide_right',
                    class_names: ['revealer', 'right'],
                    child: Widget.Label({
                        label: TEMPERATURE.bind().as((v) => `${v}º`),
                    }),
                })
                    .hook(showTemperature, revealTemp)
                    .hook(showTemperatureFixed, revealTemp),
            ],
        }),
    })
        .hook(showTemperature, updateTempClasses)
        .hook(showTemperatureFixed, updateTempClasses)
        .hook(TEMPERATURE, updateTempClasses);
