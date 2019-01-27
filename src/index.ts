import * as puppeteer from 'puppeteer-core';
import { digChat } from './lib/dig-chat';
import { getChromePath } from './lib/get-chromepath';
import { parseChat } from './lib/parse-chat';
import { digVideo } from './lib/dig-video';
import { createPage } from './lib/pt-util';
import * as process from 'process';

(async () => {
    if (process.argv.length < 3) {
        console.log('must need video id.');
        return;
    }

    const videoIds = process.argv.slice(2);
    const page = await createPage();
    for (let i = 0; i < videoIds.length; i++) {
        const videoId = videoIds[i];
        console.log(`dig ${videoId}.`);
        try {
            await digVideo(page, videoId);
            console.log(`${videoId} done.`);
        }
        catch (e) {
            console.log(`${videoId} failed.`);
            console.error(e);
        }
    }
    console.log('done');

    // ブラウザを閉じて終了する
    await page.browser().close();
})();