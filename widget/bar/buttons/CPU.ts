import { term } from 'lib/utils';
import conf from 'ags';
import { cpu, showCpuCores, showCpuCoresFixed } from 'lib/variables';
import { Box } from 'resource:///com/github/Aylur/ags/widgets/box.js';
import { ProgressBar } from 'resource:///com/github/Aylur/ags/widgets/progressbar.js';
import { Revealer } from 'resource:///com/github/Aylur/ags/widgets/revealer.js';
import { Button } from 'resource:///com/github/Aylur/ags/widgets/button.js';
import { Label } from 'resource:///com/github/Aylur/ags/widgets/label.js';

const shouldRevealCPU = () => showCpuCores.value || showCpuCoresFixed.value;

function revealCPU(obj: Revealer<Box<ProgressBar<unknown>, unknown>, unknown>) {
    obj.revealChild = shouldRevealCPU();
}

function updateCPUClasses(
    obj: Button<
        Box<
            | Label<unknown>
            | Revealer<Box<ProgressBar<unknown>, unknown>, unknown>,
            unknown
        >,
        unknown
    >,
) {
    obj.toggleClassName('fixed-hover', shouldRevealCPU());

    obj.toggleClassName(
        'urgent',
        100 - cpu.value.avg.percent_idle > conf.cpu.alert,
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
                Widget.Label({ label: conf.cpu.icon }),
                Widget.Revealer({
                    class_names: ['revealer'],
                    transition: 'slide_right',
                    transitionDuration: 500,
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
