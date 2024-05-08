import { EventBox } from 'lib/utils';
import { runcat } from 'lib/variables';
import Widget from 'resource:///com/github/Aylur/ags/widget.js';

export default () =>
    EventBox({
        class_names: ['widget', 'runcat'],
        children: [
            Widget.Label({
                label: runcat.bind().as((v) => v.text || ''),
            }),
        ],
    });
