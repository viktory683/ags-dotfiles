import configs from 'ts/config';
import { getIconFromArray, term } from 'ts/helpers';
import { NETWORK, showNetwork, showNetworkFixed } from 'lib/variables';

const shouldRevealNet = () => showNetwork.value || showNetworkFixed.value;

function revealNet(obj) {
    obj.reveal_child = shouldRevealNet();
}

function updateNetworkClasses(obj) {
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
                            ? configs.network.disabled
                            : getIconFromArray(
                                  // @ts-ignore
                                  configs.network.icons,
                                  v,
                              ),
                    ),
                }),
                Widget.Revealer({
                    transition: 'slide_right',
                    transition_duration: 500,
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
