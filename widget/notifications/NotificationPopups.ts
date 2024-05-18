import Notifications, {
    Notification,
} from 'resource:///com/github/Aylur/ags/service/notifications.js';
import conf from 'ags';

function NotificationIcon({
    app_entry,
    app_icon,
    image,
}: {
    app_entry: string | undefined;
    app_icon: string;
    image: string | undefined;
}) {
    if (image) {
        return Widget.Box({
            css:
                `background-image: url("${image}");` +
                'background-size: contain;' +
                'background-repeat: no-repeat;' +
                'background-position: center;',
        });
    }

    let icon = 'dialog-information-symbolic';
    if (Utils.lookUpIcon(app_icon)) icon = app_icon;

    if (app_entry && Utils.lookUpIcon(app_entry)) icon = app_entry;

    return Widget.Box({
        child: Widget.Icon(icon),
    });
}

function NotificationBox(n: Notification) {
    const icon = Widget.Box({
        vpack: 'start',
        class_name: 'icon',
        child: NotificationIcon(n),
    });

    const title = Widget.Label({
        class_name: 'title',
        xalign: 0,
        justification: 'left',
        hexpand: true,
        max_width_chars: 24,
        truncate: 'end',
        wrap: true,
        label: n.summary,
        use_markup: true,
    });

    const body = Widget.Label({
        class_name: 'body',
        hexpand: true,
        use_markup: true,
        xalign: 0,
        justification: 'left',
        label: n.body,
        wrap: true,
    });

    const actions = Widget.Box({
        class_name: 'actions',
        children: n.actions.map(({ id, label }) =>
            Widget.Button({
                class_name: 'action-button',
                on_clicked: () => {
                    n.invoke(id);
                    n.dismiss();
                },
                hexpand: true,
                child: Widget.Label(label),
            }),
        ),
    });

    return Widget.EventBox(
        {
            attribute: { id: n.id },
            on_primary_click: n.dismiss,
        },
        Widget.Box(
            {
                class_name: `notification ${n.urgency}`,
                vertical: true,
            },
            Widget.Box([icon, Widget.Box({ vertical: true }, title, body)]),
            actions,
        ),
    );
}

export default (monitor: number = 0) => {
    const list = Widget.Box({
        vertical: true,
        children: Notifications.popups.map(NotificationBox),
    });

    function onNotified(_: any, id: number) {
        const n = Notifications.getNotification(id);

        // @ts-ignore
        // TODO make search using regex or something
        if (n && !conf.notifications.exclude.includes(n.app_name))
            list.children = [NotificationBox(n), ...list.children];
    }

    function onDismissed(_: any, id: number) {
        // @ts-ignore
        list.children.find((n) => n.attribute.id === id)?.destroy();
    }

    list.hook(Notifications, onNotified, 'notified').hook(
        Notifications,
        onDismissed,
        'dismissed',
    );

    return Widget.Window({
        monitor,
        name: `notifications${monitor}`,
        class_name: 'notification-popups',
        anchor: ['top', 'right'],
        layer: 'overlay',
        child: Widget.Box({
            css: 'min-width: 2px; min-height: 2px;',
            class_name: 'notifications',
            vertical: true,
            child: list,

            /** this is a simple one liner that could be used instead of
                hooking into the 'notified' and 'dismissed' signals.
                but its not very optimized becuase it will recreate
                the whole list everytime a notification is added or dismissed */
            // children: notifications.bind('popups')
            //     .as(popups => popups.map(Notification))
        }),
    });
};
