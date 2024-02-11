import App from 'resource:///com/github/Aylur/ags/app.js';
import { readFile } from 'resource:///com/github/Aylur/ags/utils.js';
import * as toml from 'toml';
import { Config_t, Config } from './types/config';
import { PathReporter } from 'io-ts/PathReporter';
import { isLeft } from 'fp-ts/lib/Either';

const rawConfig = readFile(`${App.configDir}/ags.toml`);
let parsed = toml.parse(rawConfig);

parsed.CSS.paths.css = `${App.configDir}${parsed.CSS?.paths?.css}`;
parsed.CSS.paths.scss = `${App.configDir}${parsed.CSS?.paths?.scss}`;

const decoded = Config.decode(parsed);
if (isLeft(decoded)) {
    throw Error(
        `Could not validate data: ${PathReporter.report(decoded).join('\n')}`,
    );
    // e.g.: Could not validate data: Invalid value "foo" supplied to : { userId: number, name: string }/userId: number
}

const decodedConfig: Config_t = decoded.right;

export default decodedConfig;
