import { sh, getIconFromArray } from 'lib/utils';
import configs from 'ts/config';

const VOLUME = Variable(
    {
        sink: {
            volume: 0,
            mute: false,
            bluez: false,
        },
        source: {
            volume: 0,
            mute: false,
            bluez: false,
        },
    },
    {
        listen: [
            '/home/god/tmp/eww/pactl_py/.venv/bin/python /home/god/tmp/eww/pactl_py/new.py'.split(
                ' ',
            ),
            (out) => JSON.parse(out),
        ],
    },
);

const showPulseaudioFixed = Variable(false);
const showPulseaudio = Variable(false);

const shouldRevealVol = () =>
    (showPulseaudio.value || showPulseaudioFixed.value) &&
    VOLUME.value['sink']['volume'] > 0;

function revealVol(obj) {
    obj.reveal_child = shouldRevealVol();
}

function updateVolumeClasses(obj) {
    obj.toggleClassName('fixed-hover', shouldRevealVol());

    obj.toggleClassName('urgent', Math.round(VOLUME.value.sink.volume) > 100);

    obj.toggleClassName('disabled', VOLUME.value.sink.mute);
}

export default () =>
    Widget.Button({
        on_clicked: () => sh('pactl set-sink-mute @DEFAULT_SINK@ toggle'),
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
                    label: configs.volume.bluetooth,
                    visible: VOLUME.bind().as((v) => v['sink']['bluez']),
                }),
                Widget.Label({
                    label: VOLUME.bind().as((v) => {
                        if (v['sink']['mute']) {
                            return configs.volume.muted;
                        }

                        const vol = Math.round(v['sink']['volume']);
                        if (vol === 0) {
                            return configs.volume.silent;
                        }
                        if (vol > 100) {
                            return configs.volume.alert;
                        }
                        return getIconFromArray(
                            // @ts-ignore
                            configs.volume.icons,
                            vol,
                        );
                    }),
                }),
                Widget.Revealer({
                    reveal_child: false,
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
                            label: configs.volume.bluetooth,
                            visible: VOLUME.bind().as(
                                (v) => v['source']['bluez'],
                            ),
                        }),
                        Widget.Label({ label: configs.volume.mic }),
                    ],
                }),
            ],
        }),
    })
        .hook(showPulseaudio, updateVolumeClasses)
        .hook(showPulseaudioFixed, updateVolumeClasses)
        .hook(VOLUME, updateVolumeClasses);
