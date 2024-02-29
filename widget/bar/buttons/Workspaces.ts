import { sh } from 'lib/utils';
import conf from 'ags';
import Hyprland from 'resource:///com/github/Aylur/ags/service/hyprland.js';
import Widget from 'resource:///com/github/Aylur/ags/widget.js';

const dispatch = (ws: string | number) => {
    sh(`hyprctl dispatch workspace ${ws}`);
};

export default (ws: number = 10) =>
    Widget.Box({
        class_names: ['workspaces'],
        children: Array.from({ length: ws }, (_, i) => i + 1).map((i) =>
            Widget.Button({
                on_clicked: () => dispatch(i),
                attribute: i,
                label:
                    conf.workspaces.icons[`${i}`] ||
                    conf.workspaces.icons['default'],
                class_names: ['workspace', 'widget'],
            }),
        ),

        setup: (self) =>
            self.hook(Hyprland, () =>
                self.children.forEach((btn) => {
                    btn.visible = Hyprland.workspaces.some(
                        (ws) => ws.id === btn.attribute,
                    );

                    btn.toggleClassName(
                        'focused',
                        Hyprland.workspaces.some(
                            (ws) =>
                                ws.id === Hyprland.active.workspace.id &&
                                ws.id === btn.attribute,
                        ),
                    );
                }),
            ),
    });
