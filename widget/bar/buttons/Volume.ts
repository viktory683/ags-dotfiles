import { sh, getIconFromArray, term } from 'lib/utils';
import conf from 'ags';
import { showPulseaudio, showPulseaudioFixed } from 'lib/variables';
import Audio from 'resource:///com/github/Aylur/ags/service/audio.js';
import { Revealer } from 'resource:///com/github/Aylur/ags/widgets/revealer.js';
import Widget from 'resource:///com/github/Aylur/ags/widget.js';
import Gtk from '@girs/gtk-3.0';
import { Widget as Widget_t } from 'types/widgets/widget'; // TODO `import type ...`?

const shouldRevealVol = () =>
    (showPulseaudio.value || showPulseaudioFixed.value) &&
    Audio.speaker.volume > 0;

const revealVol = (obj: Revealer<Gtk.Widget, unknown>) => {
    obj.revealChild = shouldRevealVol();
};

const updateVolumeClasses = (obj: Widget_t<unknown>) => {
    const vol = Math.round(Audio.speaker.volume * 100);
    const muted = Audio.speaker.is_muted ?? true;

    obj.toggleClassName('fixed-hover', shouldRevealVol());

    obj.toggleClassName('urgent', vol > 100);

    obj.toggleClassName('disabled', muted);
};

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
                    // TODO don't see changes in default device
                    visible: Audio.speaker
                        .bind('name')
                        .as((v) => v?.includes('bluez')),
                }),
                Widget.Label({
                    // TODO don't see changes if it was muted/unmuted
                    label: Audio.speaker.bind('volume').as((v) => {
                        if (Audio.speaker.is_muted) {
                            return conf.volume.muted;
                        }

                        const vol = Math.round(v * 100);
                        if (vol === 0) {
                            return conf.volume.silent;
                        }

                        return vol > 100
                            ? conf.volume.alert
                            : // @ts-ignore
                              getIconFromArray(conf.volume.icons, vol);
                    }),
                }),
                Widget.Revealer({
                    transition: 'slide_right',
                    class_names: ['revealer'],
                    child: Widget.Label({
                        label: Audio.speaker
                            .bind('volume')
                            .as((v) => `${Math.round(v * 100)}%`),
                    }),
                })
                    .hook(Audio, revealVol)
                    .hook(showPulseaudio, revealVol)
                    .hook(showPulseaudioFixed, revealVol),
                Widget.Box({
                    visible: Audio.microphone.bind('is_muted').as((v) => !v),
                    children: [
                        Widget.Label({
                            label: conf.volume.bluetooth,
                            // TODO don't see changes in default device
                            visible: Audio.microphone
                                .bind('name')
                                .as((v) => v?.includes('bluez')),
                        }),
                        Widget.Label({ label: conf.volume.mic }),
                    ],
                }),
            ],
        }),
    })
        .hook(showPulseaudio, updateVolumeClasses)
        .hook(showPulseaudioFixed, updateVolumeClasses)
        .hook(Audio, updateVolumeClasses);
