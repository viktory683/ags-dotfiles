import { sh } from 'lib/utils';
import { showBrightness, showBrightnessFixed } from 'lib/variables';
import conf from 'ags';
import brightness from 'service/brightness';

const shouldRevealBrightness = () =>
    showBrightness.value || showBrightnessFixed.value;

function RevealBrightness(obj) {
    obj.reveal_child = shouldRevealBrightness();
}

function updateBrightnessClasses(obj) {
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
                    transition_duration: 500,
                    class_names: ['revealer'],
                    child: Widget.ProgressBar({
                        vertical: true,
                        inverted: true,
                        class_names: ['progress', 'vertical'],
                        value: brightness.bind('screen_value'),
                    }),
                })
                    .hook(showBrightness, RevealBrightness)
                    .hook(showBrightnessFixed, RevealBrightness),
            ],
        }),
    })
        .hook(showBrightness, updateBrightnessClasses)
        .hook(showBrightnessFixed, updateBrightnessClasses);
