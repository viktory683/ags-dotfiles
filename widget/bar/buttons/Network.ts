import conf from 'ags';
import { getIconFromArray, term } from 'lib/utils';
import { NETWORK, showNetwork, showNetworkFixed } from 'lib/variables';
import { Box } from 'resource:///com/github/Aylur/ags/widgets/box.js';
import { Button } from 'resource:///com/github/Aylur/ags/widgets/button.js';
import { Label } from 'resource:///com/github/Aylur/ags/widgets/label.js';
import { Revealer } from 'resource:///com/github/Aylur/ags/widgets/revealer.js';

const shouldRevealNet = () => showNetwork.value || showNetworkFixed.value;

function revealNet(obj: Revealer<Label<unknown>, unknown>) {
    obj.revealChild = shouldRevealNet();
}

function updateNetworkClasses(
    obj: Button<
        Box<Label<unknown> | Revealer<Label<unknown>, unknown>, unknown>,
        unknown
    >,
) {
    obj.toggleClassName('fixed-hover', shouldRevealNet());

    obj.toggleClassName('disabled', NETWORK.value === null);
}

export default () =>
    Widget.Button({
        on_secondary_click: () => term('bluetuith'),
        on_middle_click: () =>
            (showNetworkFixed.value = !showNetworkFixed.value),
        on_hover: () => (showNetwork.value = true),
        on_hover_lost: () => (showNetwork.value = false),
        class_names: ['widget'],
        child: Widget.Box({
            class_names: ['network'],
            children: [
                Widget.Label({
                    label: NETWORK.bind().as((v) =>
                        v === null
                            ? conf.network.disabled
                            : getIconFromArray(
                                  // @ts-ignore
                                  conf.network.icons,
                                  v,
                              ),
                    ),
                }),
                Widget.Revealer({
                    transition: 'slide_right',
                    transitionDuration: 500,
                    class_names: ['revealer'],
                    visible: NETWORK.bind().as((v) => v !== null),
                    child: Widget.Label().bind('label', NETWORK, 'value', (v) =>
                        v !== null ? `${v}%` : '',
                    ),
                })
                    .hook(showNetwork, revealNet)
                    .hook(showNetworkFixed, revealNet),
            ],
        }),
    })
        .hook(showNetwork, updateNetworkClasses)
        .hook(showNetworkFixed, updateNetworkClasses)
        .hook(NETWORK, updateNetworkClasses);
