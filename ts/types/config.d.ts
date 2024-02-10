interface Dictionary {
    [Key: string]: string;
}

export default interface config_t {
    term_launch?: string;

    battery?: {
        icons?: string | string[];
        charging?: string;
        alert?: number;
    };

    temperature?: {
        icons?: string | string[];
        alert?: string;
        min?: number;
        max?: number;
        path?: string;
    };

    memory?: {
        icon?: string;
        alert?: number;
    };

    cpu?: {
        icon?: string;
        alert?: number;
    };

    brightness?: {
        icon?: string;
    };

    network?: {
        icons?: string | string[];
        disabled?: string;
        interface?: string;
    };

    volume?: {
        icons?: string | string[];
        bluetooth?: string;
        muted?: string;
        silent?: string;
        alert?: string;
        mic?: string;
    };

    player?: {
        states?: {
            Playing: string;
            Paused: string;
            Stopped: string;
        };
    };

    workspace?: {
        icons?: Dictionary;
        default: string;
    };

    language?: {
        icons?: Dictionary;
    };

    CSS?: {
        paths?: {
            scss?: string;
            css?: string;
        };
    };

    clock?: {
        time?: string;
        date?: string;
    };
}
