import Gdk from 'gi://Gdk';
import { EventBox } from 'lib/utils';
import SystemTray from 'resource:///com/github/Aylur/ags/service/systemtray.js';
import Widget from 'resource:///com/github/Aylur/ags/widget.js';

export default () =>
    Widget.Box({
        class_names: ['tray'],
        spacing: 4,
    }).hook(SystemTray, (self) => {
        self.children = SystemTray.items
            .sort((a, b) => (a.title > b.title ? -1 : 1))
            .map((i) =>
                EventBox({
                    on_primary_click: (_: any, e: Gdk.Event) => i.activate(e),
                    on_secondary_click: (_: any, e: Gdk.Event) => i.openMenu(e),
                    class_names: ['widget', 'item'],
                    children: [Widget.Icon().bind('icon', i, 'icon')],
                    tooltipText: i.bind('tooltip_markup'),
                }),
            );
    });
