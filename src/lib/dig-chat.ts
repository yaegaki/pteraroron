import * as fs from 'fs';
import { Page, Frame } from 'puppeteer-core';
import { YTResponse, LiveChatData, LiveChatReplayContinuation, PlayerSeekContinuation } from './yt';
import { safeExposeFunction } from './pt-util';
import { VideoSummary } from './dig-video';

/**
 * 保存したチャットの情報
 */
export interface LiveChatLogInfo {
    /**
     * 取得が完了しているかどうか
     */
    done: boolean;
    /**
     * info.jsonの保存ディレクトリ
     */
    baseDir: string;
    /**
     * チャットログ
     */
    records: LiveChatLogRecord[];
}

export interface LiveChatLogRecord {
    offsetMsec: number;
    untilLastMessageMsec: number;
    filename: string;
}

function mkdirp(path: string) {
    path.split('/').reduce((a, b) => {
        const p = a + b;
        if (!fs.existsSync(p)) {
            fs.mkdirSync(p);
        }

        return p + '/';
    }, '');
}

function sleep(time: number): Promise<{}> {
    return new Promise(r => setTimeout(r, time));
}

export async function digChat(page: Page, videoSummary: VideoSummary): Promise<LiveChatLogInfo> {
    const saveDir = `video/${videoSummary.id}/chat/top`;
    mkdirp(saveDir);
    const infoPath = `${saveDir}/info.json`;

    const info = getInfo(infoPath) || {
        done: false,
        baseDir: saveDir,
        records: [],
    };
    info.baseDir = saveDir;
    info.records = info.records !== undefined ? info.records : [];

    if (info.done) {
        return info;
    }

    safeExposeFunction(page, 'sleep', sleep);
    safeExposeFunction(page, 'calcNextMsec', calcNextMsec);
    safeExposeFunction(page, 'writeToFile', writeToFile);
    safeExposeFunction(page, 'logHost', logHost);

    // 既に全部終わっている場合
    const offsetMsec = await calcNextMsec(info);
    if (offsetMsec >= videoSummary.durationMsec) {
        return info;
    }

    // チャットのiframeがロードされるまで待つ…
    // 本来ならちゃんと待ったほうがいいのだがうまい方法が分からなかったので単純に時間で待つ
    await sleep(5000);

    const liveChatFrame = page.frames().find(f => f.url().indexOf('live_chat') > 0);
    if (liveChatFrame === undefined) {
        throw new Error('not found LiveChatFrame');
    }

    const ytInitialData = await getYTInitialData(liveChatFrame);

    const header = ytInitialData.continuationContents.liveChatContinuation.header;
    if (header === undefined) {
        throw new Error('not found header in ytInitialData');
    }

    const subMenuItems = header.liveChatHeaderRenderer.viewSelector.sortFilterSubMenuRenderer.subMenuItems;
    if (subMenuItems.length == 0) {
        throw new Error('not found subMenuItem in ytInitialData');
    }

    // 上位のチャットリプレイ
    const topChatContinuation = subMenuItems[0].continuation.reloadContinuationData.continuation;

    console.log(`start digging chat v=${videoSummary.id}.`);
    await page.evaluate(async function (info: LiveChatLogInfo, infoPath: string, saveDir: string, continuation: string, durationMsec: number) {
        function getLink(c, msec) {
            return `https://www.youtube.com/live_chat_replay/get_live_chat_replay?continuation=${c}&playerOffsetMs=${msec}&hidden=false&pbj=1`;
        }

        // ホストとブラウザの両方にログを出す
        async function logBoth(v) {
            console.log(v);
            await logHost(v);
        }

        let retryCount = 0;
        while (true) {
            const offsetMsec = await calcNextMsec(info);
            if (offsetMsec >= durationMsec) {
                break;
            }
            logBoth(`next offsetMsec is ${offsetMsec}.`);

            const response = await fetch(getLink(continuation, offsetMsec));
            if (response.status >= 500) {
                // 500系のエラーは5秒まってやり直す
                await sleep(5000);
                retryCount++;
                logBoth(`retry ${offsetMsec}. (${retryCount})`)
                if (retryCount > 5) {
                    throw new Error('server internal error.');
                }
                continue;
            }
            if (response.status >= 400) {
                throw new Error('unknown error(client problem).');
            }
            retryCount = 0;
            const data: LiveChatData = await response.json();
            let seekContinuation: string | null = null;
            let untilLastMessageMsec: number = 0;
            data.response.continuationContents.liveChatContinuation.continuations.forEach(c => {
                if ((<LiveChatReplayContinuation>c).liveChatReplayContinuationData !== undefined) {
                    untilLastMessageMsec = (<LiveChatReplayContinuation>c).liveChatReplayContinuationData.timeUntilLastMessageMsec;
                }
                if ((<PlayerSeekContinuation>c).playerSeekContinuationData !== undefined) {
                    seekContinuation = (<PlayerSeekContinuation>c).playerSeekContinuationData.continuation;
                    seekContinuation = encodeURIComponent(seekContinuation);
                }
            });

            if (seekContinuation == null) {
                throw new Error('not found next seekContinuation');
            }
            if (untilLastMessageMsec <= 0) {
                throw new Error('not found next untilLastMessageMsec');
            }

            continuation = seekContinuation;

            const actions = data.response.continuationContents.liveChatContinuation.actions;
            const filename = `${offsetMsec}.json`;
            const filepath = `${saveDir}/${filename}`;
            await writeToFile(filepath, actions);
            info.records.push({
                offsetMsec: offsetMsec,
                untilLastMessageMsec: untilLastMessageMsec,
                filename: filename,
            });
            await writeToFile(infoPath, info);
            logBoth(`write ${filename} done.`);
            await sleep(1000);
        }
    }, info, infoPath, saveDir, topChatContinuation, videoSummary.id);

    return info;
}


/**
 * チャットのiframeから初期データを取得する
 * @param frame 
 */
function getYTInitialData(frame: Frame): Promise<YTResponse> {
    return frame.evaluate(async () => {
        const scripts = document.getElementsByTagName('script');
        for (let i = 0; i < scripts.length; i++) {
            const script = scripts[i];
            if (script.innerText.indexOf('window["ytInitialData"]') >= 0) {
                eval(script.innerText.replace('window["ytInitialData"]', 'window["__ytInitialData"]'));
                const d = window["__ytInitialData"];
                if (d == null) {
                    break;
                }
                return d;
            }
        }

        throw new Error('not found ytInitialData');
    });
}

function getInfo(infoPath: string): LiveChatLogInfo | null {
    if (!fs.existsSync(infoPath)) return null;
    return JSON.parse(fs.readFileSync(infoPath, 'utf-8'));
}

interface Region {
    start: number;
    end: number;
}

/**
 * 引数で渡されたログに足りない部分の最初のOffsetMsecを返す
 * @param info 
 */
async function calcNextMsec(info: LiveChatLogInfo): Promise<number> {
    // asyncにしとかないと変換結果がおかしくなる

    const regions: Region[] = [];
    info.records.forEach(r => {
        const start = r.offsetMsec;
        const end = start + r.untilLastMessageMsec;

        for (let i = 0; i < regions.length; i++) {
            const region = regions[i];
            if (region.start <= start && start <= region.end) {
                region.end = Math.max(region.end, end);
                return;
            }
            else if (region.end >= end && end >= region.start) {
                region.start = Math.min(region.start, start);
                return;
            }
        }

        regions.push({ start, end });
    });

    if (regions.length == 0) {
        return 0;
    }

    regions.sort((a, b) => {
        if (a.start < b.start) return -1;
        if (a.start > b.start) return 1;
        return 0;
    });

    let offsetMsec = 0;
    for (var i = 0; i < regions.length; i++) {
        const region = regions[i];
        if (region.start > offsetMsec) {
            break;
        }

        offsetMsec = region.end;
    }

    return offsetMsec;
}

function writeToFile(path: string, data: any): Promise<void> {
    fs.writeFileSync(path, JSON.stringify(data));
    return Promise.resolve();
}

function logHost(v: any): Promise<void> {
    console.log(v);
    return Promise.resolve();
}