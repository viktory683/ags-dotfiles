import Widget from 'resource:///com/github/Aylur/ags/widget.js';
import Date from './buttons/Date';
import Workspaces from './buttons/Workspaces';
import Mode from './buttons/Mode';
import SysTray from './buttons/SysTray';
import Language from './buttons/Language';
import Temperature from './buttons/Temperature';
import Memory from './buttons/Memory';
import CPU from './buttons/CPU';
import Brightness from './buttons/Brightness';
import Volume from './buttons/Volume';
import Network from './buttons/Network';
import Notification from './buttons/Notification';
import Battery from './buttons/Battery';
import RunCat from './buttons/RunCat';

const Expander = () => Widget.Box({ expand: true });

export default (monitor: number) =>
    Widget.Window({
        class_name: 'bar',
        child: Widget.CenterBox({
            css: 'min-width: 2px; min-height: 2px;',
            start_widget: Widget.Box({
                children: [Workspaces(12), Mode()],
            }),
            center_widget: Widget.Box({
                children: [Date()],
            }),
            end_widget: Widget.Box({
                children: [
                    Expander(),
                    SysTray(),
                    RunCat(),
                    Language(),
                    Temperature(),
                    Memory(),
                    CPU(),
                    Brightness(),
                    Volume(),
                    Network(),
                    Notification(),
                    Battery(),
                ],
            }),
        }),
        name: `bar${monitor}`,
        anchor: ['top', 'left', 'right'],
        exclusivity: 'exclusive',
        monitor: monitor,
    });
