import conf from 'ags';
import { getIconFromArray, term } from 'lib/utils';
import { showNetwork, showNetworkFixed } from 'lib/variables';
import Network from 'resource:///com/github/Aylur/ags/service/network.js';
import { Revealer } from 'resource:///com/github/Aylur/ags/widgets/revealer.js';
import Widget from 'resource:///com/github/Aylur/ags/widget.js';
import Gtk from '@girs/gtk-3.0';
import { Widget as Widget_t } from 'types/widgets/widget';

const shouldRevealNetwork = () => showNetwork.value || showNetworkFixed.value;

const revealNetwork = (obj: Revealer<Gtk.Widget, unknown>) => {
    obj.revealChild = shouldRevealNetwork();
};

const updateNetworkClasses = (obj: Widget_t<unknown>) => {
    const isWifiDisabled = Network.wifi.strength < 0;

    obj.toggleClassName('fixed-hover', shouldRevealNetwork());

    obj.toggleClassName('disabled', isWifiDisabled);
};

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
                    // TODO don't see changes
                    label: Network.wifi.bind('strength').as((v) =>
                        v < 0
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
                    // TODO don't see changes
                    visible: Network.wifi.bind('strength').as((v) => v >= 0),
                    child: Widget.Label({
                        // TODO don't see changes
                        label: Network.wifi
                            .bind('strength')
                            .as((v) => (v >= 0 ? `${v}%` : '')),
                    }),
                })
                    .hook(showNetwork, revealNetwork)
                    .hook(showNetworkFixed, revealNetwork),
            ],
        }),
    })
        .hook(showNetwork, updateNetworkClasses)
        .hook(showNetworkFixed, updateNetworkClasses)
        .hook(Network, updateNetworkClasses);
