import App from 'resource:///com/github/Aylur/ags/app.js'
import { execAsync } from 'resource:///com/github/Aylur/ags/utils.js'

const entry = App.configDir + '/ts/main.ts'
const outdir = '/tmp/ags/js'

try {
    await execAsync([
        'bun', 'build', entry,
        '--outdir', outdir,
        '--external', 'resource://*',
        '--external', 'gi://*',
    ])
} catch (error) {
    // @ts-ignore
    console.error(error)
}

const main = await import(`file://${outdir}/main.js`)

export default main.default