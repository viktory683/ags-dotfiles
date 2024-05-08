import {
    TEMPERATURE,
    showTemperature,
    showTemperatureFixed,
} from 'lib/variables';
import Widget from 'resource:///com/github/Aylur/ags/widget.js';
import conf from 'ags';
import { getIconFromArray } from 'lib/utils';
import { Revealer } from 'resource:///com/github/Aylur/ags/widgets/revealer.js';
import Gtk from '@girs/gtk-3.0';
import { Widget as Widget_t } from 'types/widgets/widget';

const shouldRevealTemp = () =>
    showTemperature.value || showTemperatureFixed.value;

function revealTemp(obj: Revealer<Gtk.Widget, unknown>) {
    obj.revealChild = shouldRevealTemp();
}

function updateTempClasses(obj: Widget_t<unknown>) {
    obj.toggleClassName('fixed-hover', shouldRevealTemp());

    obj.toggleClassName('urgent', TEMPERATURE.value > conf.temperature.max);
}

export default () =>
    Widget.EventBox({
        on_hover: () => (showTemperature.value = true),
        on_hover_lost: () => (showTemperature.value = false),
        on_middle_click: () =>
            (showTemperatureFixed.value = !showTemperatureFixed.value),
        class_names: ['widget', 'temperature'],
        child: Widget.Box({
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
