import Hyprland from 'resource:///com/github/Aylur/ags/service/hyprland.js';
import configs from 'ts/config';
import { sh } from 'lib/utils';
import { lang } from 'lib/variables';

Hyprland.connect('keyboard-layout', (_, __, layoutname: string) => {
    lang.value = layoutname;
});

sh('hyprctl devices -j').then((out) => {
    lang.value = JSON.parse(out).keyboards.find((kb) => kb.main)?.active_keymap;
});

export default () =>
    Widget.Button({
        on_clicked: () =>
            Hyprland.messageAsync(
                'switchxkblayout at-translated-set-2-keyboard next',
            ),
        class_names: ['widget'],
        label: lang.bind().as((v) => v && (configs.language.icons[v] || v)),
        tooltip_text: lang.bind(),
    });
