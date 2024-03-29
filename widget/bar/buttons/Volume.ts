import { sh, getIconFromArray, term } from 'lib/utils';
import conf from 'ags';
import { VOLUME, showPulseaudio, showPulseaudioFixed } from 'lib/variables';
import { Revealer } from 'resource:///com/github/Aylur/ags/widgets/revealer.js';
import Widget from 'resource:///com/github/Aylur/ags/widget.js';
import Gtk from '@girs/gtk-3.0';
import { Widget as Widget_t } from 'types/widgets/widget';

const shouldRevealVol = () =>
    (showPulseaudio.value || showPulseaudioFixed.value) &&
    VOLUME.value['sink']['volume'] > 0;

function revealVol(obj: Revealer<Gtk.Widget, unknown>) {
    obj.revealChild = shouldRevealVol();
}

function updateVolumeClasses(obj: Widget_t<unknown>) {
    obj.toggleClassName('fixed-hover', shouldRevealVol());

    obj.toggleClassName('urgent', Math.round(VOLUME.value.sink.volume) > 100);

    obj.toggleClassName('disabled', VOLUME.value.sink.mute);
}

export default () =>
    Widget.Button({
        on_clicked: () => sh('pactl set-sink-mute @DEFAULT_SINK@ toggle'),
        on_secondary_click: () => term('rsmixer'),
        on_middle_click: () =>
            (showPulseaudioFixed.value = !showPulseaudioFixed.value),
        on_hover: () => (showPulseaudio.value = true),
        on_hover_lost: () => (showPulseaudio.value = false),
        class_names: ['widget'],
        child: Widget.Box({
            spacing: 2,
            class_names: ['pulseaudio'],
            children: [
                Widget.Label({
                    label: conf.volume.bluetooth,
                    visible: VOLUME.bind().as((v) => v['sink']['bluez']),
                }),
                Widget.Label({
                    label: VOLUME.bind().as((v) => {
                        if (v['sink']['mute']) {
                            return conf.volume.muted;
                        }

                        const vol = Math.round(v['sink']['volume']);
                        if (vol === 0) {
                            return conf.volume.silent;
                        }
                        if (vol > 100) {
                            return conf.volume.alert;
                        }
                        return getIconFromArray(
                            // @ts-ignore
                            conf.volume.icons,
                            vol,
                        );
                    }),
                }),
                Widget.Revealer({
                    transition: 'slide_right',
                    class_names: ['revealer'],
                    child: Widget.Label({
                        label: VOLUME.bind().as(
                            (v) => `${Math.round(v['sink']['volume'])}%`,
                        ),
                    }),
                })
                    .hook(VOLUME, revealVol)
                    .hook(showPulseaudio, revealVol)
                    .hook(showPulseaudioFixed, revealVol),
                Widget.Box({
                    visible: VOLUME.bind().as((v) => !v['source']['mute']),
                    children: [
                        Widget.Label({
                            label: conf.volume.bluetooth,
                            visible: VOLUME.bind().as(
                                (v) => v['source']['bluez'],
                            ),
                        }),
                        Widget.Label({ label: conf.volume.mic }),
                    ],
                }),
            ],
        }),
    })
        .hook(showPulseaudio, updateVolumeClasses)
        .hook(showPulseaudioFixed, updateVolumeClasses)
        .hook(VOLUME, updateVolumeClasses);
