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

decodedConfig.style.paths.css = `${App.configDir}${parsed.style?.paths?.css}`;
decodedConfig.style.paths.scss = `${App.configDir}${parsed.style?.paths?.scss}`;

function convertIconsToArray(decodedConfigProperty: {
    icons: string[] | string;
}) {
    if (typeof decodedConfigProperty.icons === 'string') {
        decodedConfigProperty.icons = decodedConfigProperty.icons.split('');
    }
}

convertIconsToArray(decodedConfig.battery);
convertIconsToArray(decodedConfig.temperature);
convertIconsToArray(decodedConfig.network);
convertIconsToArray(decodedConfig.volume);

// ...

export default decodedConfig;
