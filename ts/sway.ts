// see https://i3wm.org/docs/ipc.html

enum ChangeTypes {
    Focus = 'focus',
    Init = 'init',
    Empty = 'empty',
    Urgent = 'urgent',
    // TODO
    // Reload = 'reload',
    // Rename = 'rename',
    // Restored = 'restored',
    // Move = 'move',
}

type Rect = {
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
    rect: Rect;
    output: string;
};

export function processWorkspaceEvent(
    currentWorkspaces: Workspace[],
    eventData: string,
): Workspace[] {
    const { change, old, current } = JSON.parse(eventData);

    let workspaces = [...currentWorkspaces];

    switch (change) {
        case ChangeTypes.Focus:
            workspaces.forEach((ws) => {
                if (old && ws.id === old.id) {
                    ws.focused = false;
                }
                if (ws.id === current.id) {
                    ws.focused = true;
                }
            });
            break;

        case ChangeTypes.Init:
            // TODO replace with something like inserting by index
            workspaces.push(current);
            workspaces.sort((a, b) => a.num - b.num);
            break;

        case ChangeTypes.Empty:
            const index = workspaces.findIndex((ws) => ws.id === current.id);
            if (index >= 0) {
                workspaces.splice(index, 1);
            }
            break;

        case ChangeTypes.Urgent:
            workspaces.forEach((ws) => {
                if (ws.id === current.id) {
                    ws.urgent = current.urgent;
                }
            });
            break;

        default:
            console.error(`Unknown change variant. Got ${eventData}`);
            break;
    }

    return workspaces;
}
