import conf from 'ags';
import { EventBox, getIconFromArray, term } from 'lib/utils';
import { showNetwork, showNetworkFixed } from 'lib/variables';
import Network from 'resource:///com/github/Aylur/ags/service/network.js';
import Widget from 'resource:///com/github/Aylur/ags/widget.js';
import { Widget as Widget_t } from 'types/widgets/widget';
import { Revealer as Revealer_t } from 'resource:///com/github/Aylur/ags/widgets/revealer.js';
import Gtk from '@girs/gtk-3.0';

const shouldRevealNetwork = () => showNetwork.value || showNetworkFixed.value;

const revealNetwork = (obj: Revealer_t<Gtk.Widget, unknown>) => {
    obj.revealChild = shouldRevealNetwork();
};

const updateNetworkClasses = (obj: Widget_t<unknown>) => {
    const isWifiDisabled = Network.wifi.strength < 0;

    obj.toggleClassName('fixed-hover', shouldRevealNetwork());

    obj.toggleClassName('disabled', isWifiDisabled);
};

export default () =>
    EventBox({
        on_primary_click: () => Network.toggleWifi(),
        on_secondary_click: () => term('bluetuith'),
        on_middle_click: () =>
            (showNetworkFixed.value = !showNetworkFixed.value),
        on_hover: () => (showNetwork.value = true),
        on_hover_lost: () => (showNetwork.value = false),
        class_names: ['widget', 'network'],
        children: [
            Widget.Label().hook(Network, (self) => {
                let v = Network.wifi.strength;
                self.label =
                    v < 0
                        ? conf.network.disabled
                        : getIconFromArray(
                              // @ts-ignore
                              conf.network.icons,
                              v,
                          );
            }),
            Widget.Revealer({
                transition: 'slide_right',
                transitionDuration: 500,
                child: Widget.Label().hook(Network, (self) => {
                    let v = Network.wifi.strength;
                    if (v >= 0) self.label = `${v}%`;
                }),
            })
                .hook(showNetwork, revealNetwork)
                .hook(showNetworkFixed, revealNetwork)
                .hook(Network, (self) => {
                    self.visible = Network.wifi.strength >= 0;
                }),
        ],
    })
        .hook(showNetwork, updateNetworkClasses)
        .hook(showNetworkFixed, updateNetworkClasses)
        .hook(Network, updateNetworkClasses);
