import Utils from 'resource:///com/github/Aylur/ags/utils.js';
import config from 'ts/config';

function resetCss() {
    Utils.execAsync(
        `sassc ${config.style.paths.scss} ${config.style.paths.css}`,
    )
        .then(() => {
            App.resetCss();
            App.applyCss(config.style.paths.css);
            if (config.log.level == 'debug') console.log('CSS UPDATED');
        })
        .catch((err) => console.error(err));
}

export default function init() {
    resetCss();
    Utils.monitorFile(config.style.paths.scss, (_, e) => {
        if (e !== 1) return;
        resetCss();
    });
}
