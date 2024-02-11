import App from 'resource:///com/github/Aylur/ags/app.js';
import { readFile } from 'resource:///com/github/Aylur/ags/utils.js';
import * as toml from 'toml';
import { Config_t, Config } from './types/config';
import { PathReporter } from 'io-ts/PathReporter';
import { isLeft } from 'fp-ts/lib/Either';

const rawConfig = readFile(`${App.configDir}/ags.toml`);
let parsed = toml.parse(rawConfig);

const decoded = Config.decode(parsed);
if (isLeft(decoded)) {
    throw Error(
        `Could not validate data: ${PathReporter.report(decoded).join('\n')}`,
    );
    // e.g.: Could not validate data: Invalid value "foo" supplied to : { userId: number, name: string }/userId: number
}

const decodedConfig: Config_t = decoded.right;

// config post-process

decodedConfig.CSS.paths.css = `${App.configDir}${parsed.CSS?.paths?.css}`;
decodedConfig.CSS.paths.scss = `${App.configDir}${parsed.CSS?.paths?.scss}`;

// TODO refactor

if (typeof decodedConfig.battery.icons === 'string') {
    decodedConfig.battery.icons = decodedConfig.battery.icons.split('');
}

if (typeof decodedConfig.temperature.icons === 'string') {
    decodedConfig.temperature.icons = decodedConfig.temperature.icons.split('');
}

if (typeof decodedConfig.network.icons === 'string') {
    decodedConfig.network.icons = decodedConfig.network.icons.split('');
}

if (typeof decodedConfig.volume.icons === 'string') {
    decodedConfig.volume.icons = decodedConfig.volume.icons.split('');
}

// ...

export default decodedConfig;
