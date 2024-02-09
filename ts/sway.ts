// see https://i3wm.org/docs/ipc.html

enum change_types {
    focus = 'focus',
    init = 'init',
    empty = 'empty',
    urgent = 'urgent',
    // TODO
    // reload = 'reload',
    // rename = 'rename',
    // restored = 'restored',
    // move = 'move',
}

type map = {
    x: number;
    y: number;
    width: number;
    height: number;
};

export type Workspace = {
    id: number;
    num: number;
    name: string;
    visible: boolean;
    focused: boolean;
    urgent: boolean;
    rect: map;
    output: string;
};

export function process_workspace_event(
    current_workspaces: Workspace[],
    event_data: string,
): Workspace[] {
    let _out: {
        change: change_types;
        old: null | Workspace;
        current: null | Workspace;
    } = JSON.parse(event_data);
    let change = _out.change;
    let old = _out.old;
    let current = _out.current;

    let workspaces = current_workspaces;
    switch (change) {
        case change_types.empty:
            let index = -1;
            for (let i = 0; i < workspaces.length; i++) {
                if (workspaces[i].id == current.id) {
                    index = i;
                    break;
                }
            }
            if (index > 0) workspaces.splice(index, 1);
            break;
        case change_types.focus:
            for (let i = 0; i < workspaces.length; i++) {
                if (old)
                    if (workspaces[i].id == old.id)
                        workspaces[i].focused = false;
                if (workspaces[i].id == current.id)
                    workspaces[i].focused = true;
            }
            break;
        case change_types.init:
            // TODO replace with something like inserting by index
            workspaces.push(current);
            workspaces = workspaces.sort((a, b) => a.num - b.num);
            break;
        case change_types.urgent:
            for (let i = 0; i < workspaces.length; i++) {
                if (workspaces[i].id == current.id)
                    workspaces[i].urgent = current.urgent;
            }
            break;

        default:
            console.error(`unknown chnage variant. Got ${event_data}`);
            break;
    }

    return workspaces;
}
