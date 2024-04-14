import Hyprland from 'resource:///com/github/Aylur/ags/service/hyprland.js';
import { lang, urgent_window_address, urgent_workspace_id } from './variables';

export default async function init() {
    Hyprland.connect('keyboard-layout', (_, __, layoutname: string) => {
        lang.value = layoutname;
    });

    Hyprland.connect('urgent-window', (_, windowaddress: string) => {
        urgent_window_address.value = windowaddress;

        urgent_workspace_id.value = Hyprland.clients.find(
            (c) => c.address === windowaddress,
        )?.workspace.id;
    });

    Hyprland.active.client.connect('changed', ({ address }) => {
        if (address === urgent_window_address.value) {
            urgent_window_address.value = undefined;
            urgent_workspace_id.value = undefined;
        }
    });
}
