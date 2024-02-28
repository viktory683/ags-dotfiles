import { sh } from 'lib/utils';
import configs from 'ts/config';
import Hyprland from 'resource:///com/github/Aylur/ags/service/hyprland.js';

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
                    configs.workspaces.icons[`${i}`] ||
                    configs.workspaces.icons['default'],
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
