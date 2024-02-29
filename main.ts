import conf from 'ags';

import { config, forMonitors } from 'lib/utils';
import { init } from 'lib/init';
import Bar from 'widget/bar/Bar';

export default config({
    onConfigParsed: () => {
        init();
    },
    style: conf.style.paths.css,

    windows: [...forMonitors(Bar)],
});
