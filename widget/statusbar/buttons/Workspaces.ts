import { EventBox, sh } from 'lib/utils';
import conf from 'ags';
import Hyprland from 'resource:///com/github/Aylur/ags/service/hyprland.js';
import Widget from 'resource:///com/github/Aylur/ags/widget.js';
import { urgent_workspace_id } from 'lib/variables';

const dispatch = (ws: string | number) =>
    sh(`hyprctl dispatch workspace ${ws}`);

export default (ws: number = 10) =>
    Widget.Box({
        class_names: ['workspaces'],
        children: Array.from({ length: ws }, (_, i) => 1 + i).map((i) =>
            EventBox({
                on_clicked: () => dispatch(i),
                class_names: ['widget', 'workspace'],
                children: [
                    Widget.Label({
                        label:
                            conf.workspaces.icons[`${i}`] ||
                            conf.workspaces.icons['default'],
                    }),
                ],
                attribute: i,
            }),
        ),

        setup: (self) =>
            self.hook(Hyprland, () =>
                self.children.forEach((btn) => {
                    btn.visible = Hyprland.workspaces.some(
                        // @ts-ignore
                        (ws) => ws.id === btn.attribute,
                    );

                    // @ts-ignore
                    btn.toggleClassName(
                        'focused',
                        Hyprland.workspaces.some(
                            (ws) =>
                                ws.id === Hyprland.active.workspace.id &&
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
