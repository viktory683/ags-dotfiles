import { term } from 'lib/utils';
import configs from 'ts/config';
import { cpu, showCpuCores, showCpuCoresFixed } from 'lib/variables';

const shouldRevealCPU = () => showCpuCores.value || showCpuCoresFixed.value;

function revealCPU(obj) {
    obj.reveal_child = shouldRevealCPU();
}

function updateCPUClasses(obj) {
    obj.toggleClassName('fixed-hover', shouldRevealCPU());

    obj.toggleClassName(
        'urgent',
        100 - cpu.value.avg.percent_idle > configs.cpu.alert,
    );
}

export default () =>
    Widget.Button({
        on_hover: () => (showCpuCores.value = true),
        on_hover_lost: () => (showCpuCores.value = false),
        on_middle_click: () =>
            (showCpuCoresFixed.value = !showCpuCoresFixed.value),
        on_clicked: () => term('btop'),
        class_names: ['widget'],
        child: Widget.Box({
            class_names: ['cpu'],
            children: [
                Widget.Label({ label: configs.cpu.icon }),
                Widget.Revealer({
                    class_names: ['revealer'],
                    transition: 'slide_right',
                    transition_duration: 500,
                    child: Widget.Box({
                        children: cpu.value.cores.map((core) =>
                            Widget.ProgressBar({
                                vertical: true,
                                inverted: true,
                                class_names: ['progress', 'vertical'],
                                value: cpu
                                    .bind()
                                    .as(
                                        (cpuStat) =>
                                            (100 -
                                                cpuStat.cores[
                                                    parseInt(core.cpu)
                                                ].percent_idle) /
                                            100,
                                    ),
                            }),
                        ),
                    }),
                })
                    .hook(showCpuCores, revealCPU)
                    .hook(showCpuCoresFixed, revealCPU),
            ],
        }),
    })
        .hook(showCpuCores, updateCPUClasses)
        .hook(showCpuCoresFixed, updateCPUClasses)
        .hook(cpu, updateCPUClasses);
