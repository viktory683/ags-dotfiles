import App from 'resource:///com/github/Aylur/ags/app.js';
import { readFile } from 'resource:///com/github/Aylur/ags/utils.js';
// import * as fs from 'fs';
import * as toml from 'toml';
import config_t from './types/config';

const tomlConfig = readFile(`${App.configDir}/ags.toml`);
let config: config_t = toml.parse(tomlConfig);

config.CSS.paths.css = `${App.configDir}${config.CSS?.paths?.css}`;
config.CSS.paths.scss = `${App.configDir}${config.CSS?.paths?.scss}`;

export default config;
