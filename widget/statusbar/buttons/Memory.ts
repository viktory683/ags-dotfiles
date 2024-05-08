import Widget from 'resource:///com/github/Aylur/ags/widget.js';
import conf from 'ags';
import { MEMORY, mem_t, showMemory, showMemoryFixed } from 'lib/variables';
import { Revealer } from 'resource:///com/github/Aylur/ags/widgets/revealer.js';
import Gtk from '@girs/gtk-3.0';
import { Widget as Widget_t } from 'types/widgets/widget';

const shouldRevealMem = () => showMemory.value || showMemoryFixed.value;

function revealMem(obj: Revealer<Gtk.Widget, unknown>) {
    obj.revealChild = shouldRevealMem();
}

function updateMemoryClasses(obj: Widget_t<unknown>) {
    obj.toggleClassName('fixed-hover', shouldRevealMem());

    obj.toggleClassName(
        'urgent',
        getMemoryPercentage(MEMORY.value, 'Mem') > conf.memory.alert,
    );
}

function getMemoryPercentage(memoryData: mem_t[], type: string) {
    const mem = memoryData.find((o) => o.type === type);
    if (mem) {
        return (mem.used / mem.total) * 100;
    } else {
        console.error(`Can't find ${type}!!!`);
        return 0;
    }
}

const createMemoryProgressBar = (type: string) =>
    Widget.ProgressBar({
        vertical: true,
        inverted: true,
        // class_names: ['progress', 'vertical'],
        value: MEMORY.bind().as((v) => getMemoryPercentage(v, type) / 100),
    });

export default () =>
    Widget.Button({
        on_hover: () => (showMemory.value = true),
        on_hover_lost: () => (showMemory.value = false),
        on_middle_click: () => (showMemoryFixed.value = !showMemoryFixed.value),
        class_names: ['widget', 'memory'],
        child: Widget.Box({
            children: [
                Widget.Label({ label: conf.memory.icon }),
                Widget.Revealer({
                    transition: 'slide_right',
                    transitionDuration: 500,
                    child: Widget.Box({
                        children: [
                            createMemoryProgressBar('Mem'),
                            createMemoryProgressBar('Swap'),
                        ],
                    }),
                })
                    .hook(showMemory, revealMem)
                    .hook(showMemoryFixed, revealMem),
            ],
        }),
    })
        .hook(showMemory, updateMemoryClasses)
        .hook(showMemoryFixed, updateMemoryClasses)
        .hook(MEMORY, updateMemoryClasses);
