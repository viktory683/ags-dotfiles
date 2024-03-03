import Variable from 'resource:///com/github/Aylur/ags/variable.js';

const _runcat = Variable(
    {},
    {
        listen: [
            'python /home/god/tmp/runcat-text/main.py',
            (out) => JSON.parse(out),
        ],
    },
);

export default () =>
    Widget.Label({
        label: _runcat.bind().as((v) => v.text || ''),
    });
