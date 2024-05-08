import Gdk from 'gi://Gdk';
import { EventBox } from 'lib/utils';
import SystemTray from 'resource:///com/github/Aylur/ags/service/systemtray.js';
import Widget from 'resource:///com/github/Aylur/ags/widget.js';

export default () =>
    Widget.Box().hook(SystemTray, (self) => {
        self.children = SystemTray.items
            .sort((a, b) => (a.title > b.title ? -1 : 1))
            .map((item) =>
                EventBox({
                    on_primary_click: (_: any, e: Gdk.Event) =>
                        item.activate(e),
                    on_secondary_click: (_: any, e: Gdk.Event) =>
                        item.openMenu(e),
                    class_names: ['widget', 'tray'],
                    children: [Widget.Icon().bind('icon', item, 'icon')],
                    tooltipText: item.bind('tooltip_markup'),
                }),
            );
    });
