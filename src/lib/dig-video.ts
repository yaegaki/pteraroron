import { createPage, safeExposeFunction } from "./pt-util";
import { Page } from "puppeteer";
import { writeFileSync, mkdirSync, fstat, readFileSync, existsSync } from "fs";
import { mkdirp } from "./fs-util";
import { LiveChatLogInfo, digChat } from "./dig-chat";
import { sleep } from "./sleep";

export interface VideoSummary {
    id: string,
    title: string,
    description: string,
    durationMsec: number,
}

export interface VideoInfo {
    summary?: VideoSummary;
    topChatInfo?: LiveChatLogInfo;
}

/**
 * videoの情報を探す
 * @param page 
 * @param videoId 
 */
export async function digVideo(page: Page, videoId: string): Promise<VideoInfo> {
    console.log(`start dig v=${videoId}`);
    const url = `https://www.youtube.com/watch?v=${videoId}`;
    const baseDir = `video/${videoId}`;
    // videoディレクトリがなければ作る
    mkdirp(baseDir);

    const summaryPath = `${baseDir}/summary.json`;
    const summary: VideoSummary = existsSync(summaryPath) ?
        JSON.parse(readFileSync(summaryPath, 'utf8')) :
        { id: videoId, title: '', description: '', durationMsec: 0 };
    summary.id = videoId;

    const timeout = 10000;

    await page.goto(url, { timeout });

    await page.waitForSelector('#player video', { timeout });
    // ちょっと待つ...
    // 待たないと色々面倒だったので仕方なく。
    await sleep(300);


    let retryCount = 0;
    do
    {
        // 時間の取得
        summary.durationMsec = await page.evaluate(() => {
            const video: HTMLVideoElement = document.querySelector('#player video');
            return Math.floor(video.duration * 1000);
        });

        // 広告をはじくために25分以上じゃないと拒否
        if (isNaN(summary.durationMsec) || summary.durationMsec < 1000 * 60 * 25) {
            console.log('can not get video duration. may be ad.');
            console.log('retry after 5sec.');
            await sleep(5000);
            retryCount++;
            continue;
        }

        break;
    } while (retryCount < 5);

    if (retryCount >= 5) {
        throw new Error('can not get durationMsec');
    }

    await page.evaluate(() => {
        const video: HTMLVideoElement = document.querySelector('#player video');
        video.pause();
    });


    // たまに全然違う内容のhtmlが落ちてくることがある、その場合はytInitialDataが入ってないのでエラーになるけど謎
    const summaryJSON: {title:string|null, description:string|null}  = await page.evaluate(() => {
        const contents = window['ytInitialData'].contents.twoColumnWatchNextResults.results.results.contents;
        let title = null;
        let description = null;
        const getSimpleText = textObj => {
            if (textObj.simpleText !== undefined) {
                return textObj.simpleText;
            }
            else if (textObj.runs !== undefined) {
                let text = '';
                textObj.runs.forEach(r => {
                    if (r.text !== undefined) {
                        text += r.text;
                    }
                });
                return text;
            }

            return undefined;
        };
        contents.forEach(c => {
            if (c.videoPrimaryInfoRenderer !== undefined) {
                title = getSimpleText(c.videoPrimaryInfoRenderer.title);
            }
            if (c.videoSecondaryInfoRenderer !== undefined) {
                description = getSimpleText(c.videoSecondaryInfoRenderer.description);
            }
        });
        
        return {
            title,
            description,
        }
    });

    if (summaryJSON.title == null || summaryJSON.description == null) {
        throw new Error('not found summary. v=' + videoId);
    }


    let durationSec = summary.durationMsec / 1000;
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
    if (durationSec > 0) {
        durationSec = Math.floor(durationSec);
        durationStr += `${durationSec}s`;
    }

    summary.title = summaryJSON.title;
    summary.description = summaryJSON.description;
    console.log(`title: ${summary.title}`);
    console.log(`duration: ${summary.durationMsec}msec(${durationStr})`);
    writeFileSync(summaryPath, JSON.stringify(summary));

    const topChatInfo = await digChat(page, summary);
    return {
        summary,
        topChatInfo,
    };
}