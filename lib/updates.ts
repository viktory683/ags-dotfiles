import Utils from 'resource:///com/github/Aylur/ags/utils.js';
import { updates } from 'lib/variables';

export default async function init() {
    updates.connect('changed', ({ value }) => {
        Utils.notify({
            summary: 'Updates',
            body: `Подъехали обновления для ${value} пакетов\nНажмите \`игнор\` чтобы забыть об этом до следующей перезагрузки`,
            iconName: 'system-software-update',
            actions: {
                Игнорировать: () => updates.stopPoll(),
            },
        });
    });
}
