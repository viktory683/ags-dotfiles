import Applications from 'resource:///com/github/Aylur/ags/service/applications.js';
import { Application } from 'types/service/applications';
import Gtk from '@girs/gtk-3.0';

const WINDOW_NAME = 'applauncher';

const launch = (flowBox: Gtk.FlowBox, child: Gtk.FlowBoxChild) => {
    App.toggleWindow(WINDOW_NAME);
    // @ts-ignore
    let _app: { app: Application } = child.child.attribute;
    _app.app.launch();
    flowBox.invalidate_sort();
};

const AppItem = (
    app: Application,
    iconSize: number = 64, // TODO move to config
    maxChars: number = 16, // TODO move to config
) =>
    Widget.Box({
        attribute: { app },
        vertical: true,

        children: [
            Widget.Icon({
                icon: app.icon_name || '',
                size: iconSize,
            }),
            Widget.Label({
                class_name: 'title',
                label: app.name,
                xalign: 0,
                maxWidthChars: maxChars,
                vpack: 'center',
                hpack: 'center',
                truncate: 'end',
            }),
        ],
    });

const AppsBox = (
    width: number = 500,
    height: number = 500,
    spacing: number = 12,
) => {
    let apps = Applications.list.map((app) => AppItem(app));

    const flowBox = Widget.FlowBox({
        setup: (self) => {
            apps.forEach((app) => self.add(app));

            self.set_sort_func(
                (a, b) =>
                    // @ts-ignore
                    b.child.attribute.app.frequency -
                    // @ts-ignore
                    a.child.attribute.app.frequency,
            );
        },
    });

    flowBox.connect('child-activated', launch);

    // search entry
    const entry = Widget.Entry({
        hexpand: true,
        css: `margin-bottom: ${spacing}px;`,
        placeholderText: ' Search', // TODO move to config

        // to launch the first item on Enter
        on_accept: () => {
            let fb_child = flowBox.get_child_at_pos(0, 0);
            if (fb_child) launch(flowBox, fb_child);
        },

        // filter out the list
        on_change: ({ text }: { text: string }) => {
            flowBox.set_filter_func((fb_child) =>
                // @ts-ignore
                fb_child.child.attribute.app.match(text ?? ''),
            );
        },
    });

    return Widget.Box({
        vertical: true,
        css: `margin: ${spacing * 2}px;`,
        children: [
            entry,

            // wrap the list in a scrollable
            Widget.Scrollable({
                hscroll: 'never',
                css: `min-width: ${width}px;` + `min-height: ${height}px;`,
                child: flowBox,
            }),
        ],
        setup: (self) =>
            self.hook(App, (_, windowName, visible) => {
                if (windowName !== WINDOW_NAME) return;

                // when the applauncher shows up
                if (visible) {
                    entry.text = ''; // TODO make it depend from config like "should we clear search on open?"
                    entry.grab_focus();
                }
            }),
    });
};

// there needs to be only one instance
export const Applauncher = Widget.Window({
    name: WINDOW_NAME,
    setup: (self) =>
        self.keybind('Escape', () => App.ToggleWindow(WINDOW_NAME)),
    layer: 'overlay',
    visible: false,
    keymode: 'exclusive', // 'on-demand',
    class_names: ['applauncher'],
    // anchor: ['top', 'left'],
    child: AppsBox(750, 500), // TODO move to config
});

// TODO styles
