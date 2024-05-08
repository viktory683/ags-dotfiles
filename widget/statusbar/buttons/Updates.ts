import conf from 'ags';
import { term } from 'lib/utils';
import { showUpdates, showUpdatesFixed, updates } from 'lib/variables';
import Widget from 'resource:///com/github/Aylur/ags/widget.js';
import { Widget as Widget_t } from 'types/widgets/widget';
import { Revealer as Revealer_t } from 'resource:///com/github/Aylur/ags/widgets/revealer.js';
import Gtk from '@girs/gtk-3.0';

const shouldRevealUpdates = () => showUpdates.value || showUpdatesFixed.value;

const revealUpdates = (obj: Revealer_t<Gtk.Widget, unknown>) => {
    obj.revealChild = shouldRevealUpdates();
};

const updateUpdatesClasses = (obj: Widget_t<unknown>) => {
    obj.toggleClassName('fixed-hover', shouldRevealUpdates());
};

export default () =>
    Widget.EventBox({
        on_primary_click: () => term('yay', true),
        on_hover: () => (showUpdates.value = true),
        on_hover_lost: () => (showUpdates.value = false),
        on_middle_click: () =>
            (showUpdatesFixed.value = !showUpdatesFixed.value),
        class_names: ['widget', 'updates'],
        child: Widget.Box({
            children: [
                Widget.Label({
                    label: conf.updates.icon,
                }),
                Widget.Revealer({
                    transition: 'slide_right',
                    transitionDuration: 500,
                    child: Widget.Label({
                        label: updates.bind('value').as((v) => ` ${v}`),
                    }),
                })
                    .hook(showUpdates, revealUpdates)
                    .hook(showUpdatesFixed, revealUpdates),
            ],
        }),
        visible: updates.bind('value').as((v) => v > 0),
    })
        .hook(showUpdates, updateUpdatesClasses)
        .hook(showUpdatesFixed, updateUpdatesClasses);
