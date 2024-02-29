import Hyprland from 'resource:///com/github/Aylur/ags/service/hyprland.js';
import { lang } from './variables';

export default async function init() {
    Hyprland.connect('keyboard-layout', (_, __, layoutname: string) => {
        lang.value = layoutname;
    });
}
