import { existsSync, mkdirSync } from "fs";

export function mkdirp(path: string) {
    path.split('/').reduce((a, b) => {
        const p = a + b;
        if (!existsSync(p)) {
            mkdirSync(p);
        }

        return p + '/';
    }, '');
}