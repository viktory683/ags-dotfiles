export type TreeNode = {
    id: number;
    name: string;
    type: 'root' | 'output' | 'con' | 'floating_con' | 'workspace' | 'dockarea';
    border: 'normal' | 'none' | 'pixel';
    current_border_width: number;
    layout: 'splith' | 'splitv' | 'stacked' | 'tabbed' | 'dockarea' | 'output';
    orientation: 'none' | 'horizontal' | 'vertical';
    percent: number | null;
    rect: { x: number; y: number; width: number; height: number };
    window_rect?: { x: number; y: number; width: number; height: number };
    deco_rect?: { x: number; y: number; width: number; height: number };
    actual_deco_rect?: { x: number; y: number; width: number; height: number };
    geometry?: { x: number; y: number; width: number; height: number };
    window?: number | null;
    window_properties?: Record<string, string>;
    window_type?:
        | 'undefined'
        | 'unknown'
        | 'normal'
        | 'dialog'
        | 'utility'
        | 'toolbar'
        | 'splash'
        | 'menu'
        | 'dropdown_menu'
        | 'popup_menu'
        | 'tooltip'
        | 'notification';
    urgent: boolean;
    marks: string[];
    focused: boolean;
    focus: number[];
    sticky: boolean;
    fullscreen_mode: 0 | 1 | 2;
    floating: 'auto_on' | 'auto_off' | 'user_on' | 'user_off';
    nodes?: TreeNode[];
    floating_nodes?: TreeNode[];
    scratchpad_state?: 'none' | 'fresh' | 'changed';
};

export type XkbLayoutChange = {
    change: 'xkb_layout';
    input: {
        identifier: string;
        name: string;
        vendor: number;
        product: number;
        type: 'keyboard';
        repeat_delay: number;
        repeat_rate: number;
        xkb_layout_names: string[];
        xkb_active_layout_index: number;
        xkb_active_layout_name: string;
        libinput: {
            send_events: 'enabled';
        };
    };
};

export type InputDevice = {
    identifier: string;
    name: string;
    vendor: number;
    product: number;
    type:
        | 'touchpad'
        | 'pointer'
        | 'keyboard'
        | 'touch'
        | 'tablet_tool'
        | 'tablet_pad'
        | 'switch';
    repeat_delay?: number;
    repeat_rate?: number;
    xkb_layout_names?: string[];
    xkb_active_layout_index?: number;
    xkb_active_layout_name?: string;
    scroll_factor?: number;
    libinput: {
        send_events: 'enabled';
        tap?: 'enabled';
        tap_button_map?: 'lrm';
        tap_drag?: 'enabled';
        tap_drag_lock?: 'disabled';
        accel_speed?: number;
        accel_profile?: 'adaptive';
        natural_scroll?: 'enabled' | 'disabled';
        left_handed?: 'enabled' | 'disabled';
        click_method?: 'button_areas';
        middle_emulation?: 'enabled' | 'disabled';
        scroll_method?: 'two_finger';
        dwt?: 'enabled' | 'disabled';
        dwtp?: 'enabled' | 'disabled';
        scroll_button?: number;
    };
};

export type mode_t = {
    name: string;
};
