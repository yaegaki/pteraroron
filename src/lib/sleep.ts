export function sleep(time: number): Promise<{}> {
    return new Promise(r => setTimeout(r, time));
}