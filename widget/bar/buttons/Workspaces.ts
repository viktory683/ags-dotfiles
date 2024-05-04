import { sh } from 'lib/utils';
import conf from 'ags';
import hyprland from 'resource:///com/github/Aylur/ags/service/hyprland.js';
import Widget from 'resource:///com/github/Aylur/ags/widget.js';
import { urgent_workspace_id } from 'lib/variables';

const dispatch = (ws: string | number) =>
    sh(`hyprctl dispatch workspace ${ws}`);

export default (ws: number = 10) =>
    Widget.Box({
        class_names: ['workspaces'],
        children: Array.from({ length: ws }, (_, i) => 1 + i).map((i) =>
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
            self.hook(hyprland, () =>
                self.children.forEach((btn) => {
                    btn.visible = hyprland.workspaces.some(
                        // @ts-ignore
                        (ws) => ws.id === btn.attribute,
                    );

                    // @ts-ignore
                    btn.toggleClassName(
                        'focused',
                        hyprland.workspaces.some(
                            (ws) =>
                                ws.id === hyprland.active.workspace.id &&
                                // @ts-ignore
                                ws.id === btn.attribute,
                        ),
                    );

                    // @ts-ignore
                    btn.toggleClassName(
                        'urgent',
                        // @ts-ignore
                        btn.attribute === urgent_workspace_id.value,
                    );
                }),
            ),
    });
