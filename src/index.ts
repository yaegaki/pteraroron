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

    const videoId = process.argv[2];
    const page = await createPage();
    try {
        await digVideo(page, videoId);
    }
    catch (e) {
        console.error(e);
    }
    console.log('done');

    // ブラウザを閉じて終了する
    await page.browser().close();
})();