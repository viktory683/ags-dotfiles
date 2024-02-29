import Utils from 'resource:///com/github/Aylur/ags/utils.js';
import conf from 'ags';

function resetCss() {
    Utils.execAsync(`sassc ${conf.style.paths.scss} ${conf.style.paths.css}`)
        .then(() => {
            App.resetCss();
            App.applyCss(conf.style.paths.css);
            if (conf.log.level == 'debug') console.log('CSS UPDATED');
        })
        .catch((err) => console.error(err));
}

export default function init() {
    resetCss();
    Utils.monitorFile(conf.style.paths.scss, (_, e) => {
        if (e !== 1) return;
        resetCss();
    });
}
