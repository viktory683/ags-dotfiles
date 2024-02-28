import configs from 'ts/config';

import { config, forMonitors } from 'lib/utils';
import { init } from 'lib/init';
import Bar from 'widget/bar/Bar';

export default config({
    onConfigParsed: () => {
        init();
    },
    style: configs.style.paths.css,

    windows: [...forMonitors(Bar)],
});
