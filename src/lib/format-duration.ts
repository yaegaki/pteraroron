
export function formatDuration(msec: number): string {
    let durationSec = Math.floor(msec / 1000);

    let durationStr = '';
    if (durationSec > 3600) {
        const h = Math.floor(durationSec / 3600);
        durationSec -= h * 3600;
        durationStr = `${h}h`;
    }
    if (durationSec > 60) {
        const m = Math.floor(durationSec / 60);
        durationSec -= m * 60;
        durationStr += `${m}m`;
    }

    durationSec = durationSec;
    durationStr += `${durationSec}s`;
    return durationStr;
}