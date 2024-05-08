import { runcat } from 'lib/variables';
import Widget from 'resource:///com/github/Aylur/ags/widget.js';

export default () =>
    Widget.EventBox({
        class_names: ['widget', 'runcat'],
        child: Widget.Box({
            children: [
                Widget.Label({
                    label: runcat.bind().as((v) => v.text || ''),
                }),
            ],
        }),
    });
