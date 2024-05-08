import { clock } from 'lib/variables';
import Widget from 'resource:///com/github/Aylur/ags/widget.js';
import conf from 'ags';
import { EventBox } from 'lib/utils';

export default () =>
    EventBox({
        class_names: ['widget', 'date'],
        children: [
            Widget.Label({
                label: clock.bind().as((v) => v.format(conf.clock.time) || ''),
            }),
        ],
        tooltipText: clock.bind().as((v) => v.format(conf.clock.date) || ''),
    });
