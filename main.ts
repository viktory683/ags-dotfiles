import conf from 'ags';
import { config, forMonitors, sh } from 'lib/utils';
import { init } from 'lib/init';
import Bar from 'widget/bar/Bar';

sh(`touch ${conf.style.paths.css}`);

export default config({
    onConfigParsed: () => {
        init();
    },
    style: conf.style.paths.css,

    windows: [...forMonitors(Bar)],
});
