import App from 'resource:///com/github/Aylur/ags/app.js';
import conf from 'ags';
import { forMonitors, sh } from 'lib/utils';
import { init } from 'lib/init';
import Bar from 'widget/bar/Bar';

sh(`touch ${conf.style.paths.css}`);

export default App.config({
    onConfigParsed: () => {
        init();
    },
    style: conf.style.paths.css,

    windows: [...forMonitors(Bar)],
});
