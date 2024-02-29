import { clock } from 'lib/variables';
import Widget from 'resource:///com/github/Aylur/ags/widget.js';
import conf from 'ags';

export default () =>
    Widget.Label({
        class_names: ['clock', 'widget'],
        label: clock.bind().as((v) => v.format(conf.clock.time) || ''),
        tooltipText: clock.bind().as((v) => v.format(conf.clock.date) || ''),
    });
