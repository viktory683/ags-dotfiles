import Hyprland from 'resource:///com/github/Aylur/ags/service/hyprland.js';
import Widget from 'resource:///com/github/Aylur/ags/widget.js';
import conf from 'ags';
import { EventBox, sh } from 'lib/utils';
import { lang } from 'lib/variables';

interface Mouse {
    address: string;
    name: string;
    defaultSpeed: number;
}

interface Keyboard {
    address: string;
    name: string;
    rules: string;
    model: string;
    layout: string;
    variant: string;
    options: string;
    active_keymap: string;
    main: boolean;
}

interface Switch {
    address: string;
    name: string;
}

interface DeviceConfiguration {
    mice: Mouse[];
    keyboards: Keyboard[];
    tablets: any[]; // Assuming tablets can have any structure, adjust as needed
    touch: any[]; // Assuming touch can have any structure, adjust as needed
    switches: Switch[];
}

sh('hyprctl devices -j').then((out) => {
    let data: DeviceConfiguration = JSON.parse(out);
    lang.value = data.keyboards.find((kb) => kb.main)?.active_keymap || '';
});

export default () =>
    EventBox({
        on_primary_click: () =>
            Hyprland.messageAsync(
                'switchxkblayout at-translated-set-2-keyboard next',
            ),
        class_names: ['widget', 'language'],
        children: [
            Widget.Label({
                label: lang
                    .bind()
                    .as((v) => v && (conf.language.icons[v] || v)),
            }),
        ],
        tooltipText: lang.bind(),
    });
