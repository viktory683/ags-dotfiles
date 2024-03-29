import { mode } from 'lib/variables';
import Hyprland from 'resource:///com/github/Aylur/ags/service/hyprland.js';
import Widget from 'resource:///com/github/Aylur/ags/widget.js';

Hyprland.connect('submap', (_, name: string) => {
    mode.value = name;
});

export default () =>
    Widget.Revealer({
        transitionDuration: 500,
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

            if (mode.value !== '') self.label = mode.value;
        }),
    });
