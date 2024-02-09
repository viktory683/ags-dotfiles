enum change_variants {
    focus = 'focus',
    init = 'init',
    empty = 'empty',
    urgent = 'urgent',
}

type Rect = {
    x: number;
    y: number;
    width: number;
    height: number;
};

type FloatingNode = {
    id: number;
    type: string;
    orientation: string;
    percent: number;
    urgent: boolean;
    marks: any[];
    focused: boolean;
    layout: string;
    border: string;
    current_border_width: number;
    rect: Rect;
    deco_rect: Rect;
    window_rect: Rect;
    geometry: Rect;
    name: string;
    window: null;
    nodes: any[];
    floating_nodes: any[];
    focus: number[];
    fullscreen_mode: number;
    sticky: boolean;
    pid: number;
    app_id: string;
    visible: boolean;
    max_render_time: number;
    shell: string;
    inhibit_idle: boolean;
    idle_inhibitors: {
        user: string;
        application: string;
    };
};

export type Workspace = {
    id: number;
    type: string;
    orientation: string;
    percent: null;
    urgent: boolean;
    marks: any[];
    layout: string;
    border: string;
    current_border_width: number;
    rect: Rect;
    deco_rect: Rect;
    window_rect: Rect;
    geometry: Rect;
    name: string;
    window: null;
    nodes: any[];
    floating_nodes: FloatingNode[];
    focus: number[];
    fullscreen_mode: number;
    sticky: boolean;
    num: number;
    output: string;
    representation: string;
    focused: boolean;
    visible: boolean;
};

export function process_subscribe_workspaces(
    current_workspaces: Workspace[],
    data: string,
): Workspace[] {
    let _out: {
        change: change_variants;
        old: null | Workspace;
        current: Workspace;
    } = JSON.parse(data);
    let change = _out.change;
    let old = _out.old;
    let current = _out.current;

    let workspaces = current_workspaces;
    switch (change) {
        case change_variants.empty:
            let index = -1;
            for (let i = 0; i < workspaces.length; i++) {
                if (workspaces[i].id == current.id) {
                    index = i;
                    break;
                }
            }
            if (index > 0) workspaces.splice(index, 1);
            break;
        case change_variants.focus:
            for (let i = 0; i < workspaces.length; i++) {
                // @ts-ignore
                if (workspaces[i].id == old.id) workspaces[i].focused = false;
                if (workspaces[i].id == current.id)
                    workspaces[i].focused = true;
            }
            break;
        case change_variants.init:
            // TODO replace with something like inserting by index
            workspaces.push(current);
            workspaces = workspaces.sort((a, b) => a.num - b.num);
            break;
        case change_variants.urgent:
            for (let i = 0; i < workspaces.length; i++) {
                if (workspaces[i].id == current.id)
                    workspaces[i].urgent = current.urgent;
            }
            break;

        default:
            console.error(`unknown chnage variant. Got ${data}`);
            break;
    }

    return workspaces;
}
