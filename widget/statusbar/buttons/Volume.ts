import Gtk from '@girs/gtk-3.0';
import conf from 'ags';
import { sh, getIconFromArray, term } from 'lib/utils';
import { showPulseaudio, showPulseaudioFixed } from 'lib/variables';
import Audio from 'resource:///com/github/Aylur/ags/service/audio.js';
import Widget from 'resource:///com/github/Aylur/ags/widget.js';
import { Widget as Widget_t } from 'types/widgets/widget';
import { Revealer as Revealer_t } from 'resource:///com/github/Aylur/ags/widgets/revealer.js';

const shouldRevealVol = () =>
    (showPulseaudio.value || showPulseaudioFixed.value) &&
    Audio.speaker.volume > 0;

const revealVol = (obj: Revealer_t<Gtk.Widget, unknown>) => {
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
    Widget.EventBox({
        on_clicked: () => sh('pactl set-sink-mute @DEFAULT_SINK@ toggle'),
        on_secondary_click: () => term('rsmixer'),
        on_middle_click: () =>
            (showPulseaudioFixed.value = !showPulseaudioFixed.value),
        on_hover: () => (showPulseaudio.value = true),
        on_hover_lost: () => (showPulseaudio.value = false),
        class_names: ['widget', 'volume'],
        child: Widget.Box({
            spacing: 2,
            children: [
                Widget.Label({
                    label: conf.volume.bluetooth,
                }).hook(
                    Audio,
                    (self) => {
                        self.visible =
                            Audio.speaker.name?.includes('bluez') || false;
                    },
                    'speaker-changed',
                ),
                Widget.Label().hook(
                    Audio,
                    (self) => {
                        self.label = (() => {
                            let vol = Math.round(Audio.speaker.volume * 100);

                            return Audio.speaker.is_muted
                                ? conf.volume.muted
                                : vol === 0
                                ? conf.volume.silent
                                : vol > 100
                                ? conf.volume.alert
                                : getIconFromArray(
                                      // @ts-ignore
                                      conf.volume.icons,
                                      vol,
                                  );
                        })();
                    },
                    'speaker-changed',
                ),
                Widget.Revealer({
                    transition: 'slide_right',
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
                        }).hook(
                            Audio,
                            (self) => {
                                self.visible =
                                    Audio.microphone.name?.includes('bluez') ||
                                    false;
                            },
                            'microphone-changed',
                        ),
                        Widget.Label({ label: conf.volume.mic }),
                    ],
                }),
            ],
        }),
    })
        .hook(showPulseaudio, updateVolumeClasses)
        .hook(showPulseaudioFixed, updateVolumeClasses)
        .hook(Audio, updateVolumeClasses);
