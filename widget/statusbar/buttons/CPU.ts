import { term } from 'lib/utils';
import conf from 'ags';
import { cpu, showCpuCores, showCpuCoresFixed } from 'lib/variables';
import { Revealer } from 'resource:///com/github/Aylur/ags/widgets/revealer.js';
import Widget from 'resource:///com/github/Aylur/ags/widget.js';
import Gtk from '@girs/gtk-3.0';
import { Widget as Widget_t } from 'types/widgets/widget';

const shouldRevealCPU = () => showCpuCores.value || showCpuCoresFixed.value;

function revealCPU(obj: Revealer<Gtk.Widget, unknown>) {
    obj.revealChild = shouldRevealCPU();
}

function updateCPUClasses(obj: Widget_t<unknown>) {
    obj.toggleClassName('fixed-hover', shouldRevealCPU());

    obj.toggleClassName(
        'urgent',
        100 - cpu.value.avg.percent_idle > conf.cpu.alert,
    );
}

export default () =>
    Widget.EventBox({
        on_hover: () => (showCpuCores.value = true),
        on_hover_lost: () => (showCpuCores.value = false),
        on_middle_click: () =>
            (showCpuCoresFixed.value = !showCpuCoresFixed.value),
        on_primary_click: () => term('btop'),
        class_names: ['widget', 'cpu'],
        child: Widget.Box({
            children: [
                Widget.Label({ label: conf.cpu.icon }),
                Widget.Revealer({
                    transition: 'slide_right',
                    transitionDuration: 500,
                    child: Widget.Box({
                        children: cpu.value.cores.map((core) =>
                            Widget.ProgressBar({
                                vertical: true,
                                inverted: true,
                                // class_names: ['progress', 'vertical'],
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
