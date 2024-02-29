import { sh } from 'lib/utils';
import { showBrightness, showBrightnessFixed } from 'lib/variables';
import conf from 'ags';
import brightness from 'service/brightness';
import { Revealer } from 'resource:///com/github/Aylur/ags/widgets/revealer.js';
import Widget from 'resource:///com/github/Aylur/ags/widget.js';
import Gtk from '@girs/gtk-3.0';
import { Widget as Widget_t } from 'types/widgets/widget';

const shouldRevealBrightness = () =>
    showBrightness.value || showBrightnessFixed.value;

function revealBrightness(obj: Revealer<Gtk.Widget, unknown>) {
    obj.revealChild = shouldRevealBrightness();
}

function updateBrightnessClasses(obj: Widget_t<unknown>) {
    obj.toggleClassName('fixed-hover', shouldRevealBrightness());
}

export default () =>
    Widget.Button({
        on_hover: () => (showBrightness.value = true),
        on_hover_lost: () => (showBrightness.value = false),
        on_middle_click: () =>
            (showBrightnessFixed.value = !showBrightnessFixed.value),
        on_scroll_up: () => sh('brightnessctl -e s 1-%'),
        on_scroll_down: () => sh('brightnessctl -e s 1+%'),
        visible: brightness.bind('screen_value').as((v) => v < 1),
        child: Widget.Box({
            class_names: ['brightness'],
            children: [
                Widget.Label({ label: conf.brightness.icon }),
                Widget.Revealer({
                    transition: 'slide_right',
                    transitionDuration: 500,
                    class_names: ['revealer'],
                    child: Widget.ProgressBar({
                        vertical: true,
                        inverted: true,
                        class_names: ['progress', 'vertical'],
                        value: brightness.bind('screen_value'),
                    }),
                })
                    .hook(showBrightness, revealBrightness)
                    .hook(showBrightnessFixed, revealBrightness),
            ],
        }),
    })
        .hook(showBrightness, updateBrightnessClasses)
        .hook(showBrightnessFixed, updateBrightnessClasses);
