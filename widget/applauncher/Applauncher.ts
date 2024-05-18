import conf from 'ags';
import Applications from 'resource:///com/github/Aylur/ags/service/applications.js';
import { Application } from 'types/service/applications';
import Gtk from '@girs/gtk-3.0';

const WINDOW_NAME = 'applauncher';

const launch = (flowBox: Gtk.FlowBox, child: Gtk.FlowBoxChild) => {
    App.toggleWindow(WINDOW_NAME);
    // @ts-ignore
    let app: Application = child.child.attribute.app;
    app.launch();
    flowBox.invalidate_sort();
};

const AppItem = (app: Application) =>
    Widget.Box({
        attribute: { app },
        vertical: true,
        children: [
            Widget.Icon({
                icon: app.icon_name || '',
                size: conf.launcher.iconSize,
            }),
            Widget.Label({
                class_name: 'title',
                label: app.name,
                xalign: 0,
                maxWidthChars: conf.launcher.maxChars,
                vpack: 'center',
                hpack: 'center',
                truncate: 'end',
            }),
        ],
    });

const AppsBox = () => {
    const apps = Applications.list.map(AppItem);

    const flowBox = Widget.FlowBox({
        setup: (self: Gtk.FlowBox) => {
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

    const entry = Widget.Entry({
        hexpand: true,
        css: `margin-bottom: ${conf.launcher.spacing}px;`,
        placeholderText: conf.launcher.placeholderText,
        on_accept: () => {
            const fbChild = flowBox.get_child_at_pos(0, 0);
            if (fbChild) launch(flowBox, fbChild);
        },
        on_change: ({ text }: { text: string }) => {
            flowBox.set_filter_func((fbChild) =>
                // @ts-ignore
                fbChild.child.attribute.app.match(text ?? ''),
            );
        },
    });

    return Widget.Box({
        vertical: true,
        css: `margin: ${conf.launcher.spacing * 2}px;`,
        children: [
            entry,
            Widget.Scrollable({
                hscroll: 'never',
                css: `min-width: ${conf.launcher.width}px; min-height: ${conf.launcher.height}px;`,
                child: flowBox,
            }),
        ],
        setup: (self) =>
            self.hook(App, (_, windowName, visible) => {
                if (windowName !== WINDOW_NAME) return;
                if (visible && conf.launcher.clearSearchOnOpen) {
                    entry.text = '';
                    entry.grab_focus();
                }
            }),
    });
};

export const Applauncher = Widget.Window({
    name: WINDOW_NAME,
    setup: (self) =>
        self.keybind('Escape', () => App.ToggleWindow(WINDOW_NAME)),
    layer: 'overlay',
    visible: false,
    keymode: 'exclusive', // 'on-demand',
    class_names: ['applauncher'],
    child: AppsBox(),
});

// TODO styles
