import * as fs from 'fs';
import * as path from 'path';
import * as process from 'process';

export function getChromePath(): string {
    const result = getChromePathWin32();
    if (result == null) {
        throw new Error('not found chrome.');
    }

    return result;
}

function getChromePathWin32(): string | null {
    const suffix = `${path.sep}Google${path.sep}Chrome${path.sep}Application${path.sep}chrome.exe`;
    const prefixes = [
        process.env.LOCALAPPDATA, process.env.PROGRAMFILES, process.env['PROGRAMFILES(X86)']
    ].filter(Boolean);

    let result: string | null = null;
    prefixes.forEach(prefix => {
        const chromePath = path.join(prefix, suffix);
        try {
            fs.accessSync(chromePath);
            result = chromePath;
            return true;
        } catch (e) {
            return false;
        }
    });

    return result;
}