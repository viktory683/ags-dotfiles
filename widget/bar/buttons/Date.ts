import { date, time } from 'lib/variables';
import Widget from 'resource:///com/github/Aylur/ags/widget.js';

export default () =>
    Widget.Label({
        class_names: ['clock', 'widget'],
        label: time.bind(),
        tooltip_text: date.bind(),
    });
