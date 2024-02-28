import {
    TEMPERATURE,
    showTemperature,
    showTemperatureFixed,
} from 'lib/variables';
import Widget from 'resource:///com/github/Aylur/ags/widget.js';
import configs from 'ts/config';
import { getIconFromArray } from 'ts/helpers';

const shouldRevealTemp = () =>
    showTemperature.value || showTemperatureFixed.value;

function revealTemp(obj) {
    obj.reveal_child = shouldRevealTemp();
}

function updateTempClasses(obj) {
    obj.toggleClassName('fixed-hover', shouldRevealTemp());

    obj.toggleClassName('urgent', TEMPERATURE.value > configs.temperature.max);
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
                            configs.temperature.icons,
                            v,
                            configs.temperature.min,
                            configs.temperature.max,
                        ),
                    ),
                }),
                Widget.Revealer({
                    transition_duration: 500,
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
