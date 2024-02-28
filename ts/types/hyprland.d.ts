interface Mouse {
    address: string;
    name: string;
    defaultSpeed: number;
}

interface Keyboard {
    address: string;
    name: string;
    rules: string;
    model: string;
    layout: string;
    variant: string;
    options: string;
    active_keymap: string;
    main: boolean;
}

interface Switch {
    address: string;
    name: string;
}

interface DeviceConfiguration {
    mice: Mouse[];
    keyboards: Keyboard[];
    // tablets: any[];
    // touch: any[];
    switches: Switch[];
}

export default DeviceConfiguration;
