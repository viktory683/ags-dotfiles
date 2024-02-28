import { mode } from 'lib/variables';
import Hyprland from 'resource:///com/github/Aylur/ags/service/hyprland.js';

Hyprland.connect('submap', (_, name: string) => {
    mode.value = name;
});

export default () =>
    Widget.Revealer({
        transition_duration: 500,
        transition: 'slide_right',
        revealChild: mode.bind().as((v) => v !== ''),
        child: Widget.Button({
            on_clicked: () => Hyprland.messageAsync('dispatch submap reset'),
            label: '',
            class_names: ['widget', 'mode'],
        }).hook(mode, (self) => {
            const oldMode = self.class_names.find((m) => m.startsWith('mode_'));
            self.toggleClassName(`mode_${mode.value}`, true);
            if (oldMode) self.toggleClassName(oldMode, false);

            // @ts-ignore
            if (mode.value !== '') self.label = mode.value;
        }),
    });
