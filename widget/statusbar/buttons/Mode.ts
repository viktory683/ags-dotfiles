import { EventBox } from 'lib/utils';
import { mode } from 'lib/variables';
import Hyprland from 'resource:///com/github/Aylur/ags/service/hyprland.js';
import Widget from 'resource:///com/github/Aylur/ags/widget.js';

export default () =>
    EventBox({
        on_primary_click: () => Hyprland.messageAsync('dispatch submap reset'),
        class_names: ['widget', 'mode'],
        children: [
            Widget.Label({
                label: mode.bind(),
            }),
        ],
        visible: mode.bind().as((v) => v !== ''),
    });
