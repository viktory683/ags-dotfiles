import { sh } from 'lib/utils';
import { notification } from 'lib/variables';
import conf from 'ags';
import Widget from 'resource:///com/github/Aylur/ags/widget.js';
import { Widget as Widget_t } from 'types/widgets/widget';

const updateNotificationClasses = (obj: Widget_t<unknown>) => {
    obj.toggleClassName(
        'disabled',
        ['dnd-notification', 'dnd-none'].includes(notification.value.class),
    );
};

export default () =>
    Widget.EventBox({
        on_clicked: () => sh('swaync-client -t -sw'),
        on_secondary_click: () => sh('swaync-client -d -sw'),
        class_names: ['widget', 'notifications'],
        child: Widget.Box({
            children: [
                Widget.Label({
                    label: notification
                        .bind()
                        .as((v) => conf.notification.icons[v.alt] || v.alt),
                    useMarkup: true,
                    tooltipText: notification.bind().as((v) => v.tooltip),
                }).hook(notification, (self) => {
                    if (
                        ['dnd-notification', 'dnd-none'].includes(
                            notification.value.class,
                        )
                    ) {
                        self.label = self.label.replaceAll(
                            '#cf6679',
                            '#7a7a7a',
                        );
                    } else {
                        self.label = self.label.replaceAll(
                            '#7a7a7a',
                            '#cf6679',
                        );
                    }
                }),
            ],
        }),
    }).hook(notification, updateNotificationClasses);
