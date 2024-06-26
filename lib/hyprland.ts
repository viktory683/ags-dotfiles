import Hyprland from 'resource:///com/github/Aylur/ags/service/hyprland.js';
import {
    lang,
    mode,
    urgent_window_addr,
    urgent_workspace_id,
} from 'lib/variables';

export default async function init() {
    Hyprland.connect('keyboard-layout', (_, __, layoutname: string) => {
        lang.value = layoutname;
    });

    Hyprland.connect('submap', (_, name: string) => {
        mode.value = name;
    });

    // urgency

    Hyprland.connect('urgent-window', (_, windowaddress: string) => {
        urgent_window_addr.value = windowaddress;

        urgent_workspace_id.value = Hyprland.clients.find(
            (c) => c.address === windowaddress,
        )?.workspace.id;
    });

    Hyprland.active.client.connect('changed', ({ address }) => {
        if (address === urgent_window_addr.value) {
            urgent_window_addr.value = undefined;
            urgent_workspace_id.value = undefined;
        }
    });

    // ...
}
