import Widget from 'resource:///com/github/Aylur/ags/widget.js';

import configs from 'ts/config';
import { MEMORY, mem_t, showMemory, showMemoryFixed } from 'lib/variables';

const shouldRevealMem = () => showMemory.value || showMemoryFixed.value;

function revealMem(obj) {
    obj.reveal_child = shouldRevealMem();
}

function updateMemoryClasses(obj) {
    obj.toggleClassName('fixed-hover', shouldRevealMem());

    obj.toggleClassName(
        'urgent',
        getMemoryPercentage(MEMORY.value, 'Mem') > configs.memory.alert,
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
        class_names: ['progress', 'vertical'],
        value: MEMORY.bind().as((v) => getMemoryPercentage(v, type) / 100),
    });

export default () =>
    Widget.Button({
        on_hover: () => (showMemory.value = true),
        on_hover_lost: () => (showMemory.value = false),
        on_middle_click: () => (showMemoryFixed.value = !showMemoryFixed.value),
        class_names: ['widget'],
        child: Widget.Box({
            class_names: ['memory'],
            children: [
                Widget.Label({ label: configs.memory.icon }),
                Widget.Revealer({
                    transition: 'slide_right',
                    transition_duration: 500,
                    class_names: ['revealer'],
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
