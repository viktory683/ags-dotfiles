import App from 'resource:///com/github/Aylur/ags/app.js';
import conf from 'ags';
import { forMonitors, sh } from 'lib/utils';
import { init } from 'lib/init';
import StatusBar from 'widget/statusbar/StatusBar';
import NotificationPopups from 'widget/notifications/NotificationPopups';

sh(`touch ${conf.style.paths.css}`);

export default App.config({
    onConfigParsed: () => {
        init();
    },
    style: conf.style.paths.css,

    windows: [...forMonitors(StatusBar), ...forMonitors(NotificationPopups)],
});
