import SystemTray from 'resource:///com/github/Aylur/ags/service/systemtray.js';
import Gdk from 'types/@girs/gdk-3.0/gdk-3.0';

export default () =>
    Widget.Box({
        class_names: ['widget', 'tray'],
    }).hook(SystemTray, (self) => {
        self.children = SystemTray.items
            .sort((a, b) => (a.title > b.title ? -1 : 1))
            .map((item) =>
                Widget.Button({
                    child: Widget.Icon().bind('icon', item, 'icon'),
                    on_primary_click: (_, e: Gdk.Event) => item.activate(e),
                    on_secondary_click: (_, e: Gdk.Event) => item.openMenu(e),
                    tooltip_text: item.bind('tooltip_markup'),
                }),
            );
    });
