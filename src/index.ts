import * as puppeteer from 'puppeteer-core';
import { digChat } from './lib/dig-chat';
import { getChromePath } from './lib/get-chromepath';
import { parseChat } from './lib/parse-chat';
import { digVideo } from './lib/dig-video';
import { createPage } from './lib/pt-util';

(async () => {
    const videoId = 'itCtbmck-vM';

    const page = await createPage();
    const vInfo = await digVideo(page, videoId);
    console.log('dig done.');

    const encoded = parseChat(vInfo.topChatInfo!);
    encoded.records.forEach(r => {
        let durationSec = r.offsetMsec / 1000;
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

        console.log(`${durationStr}:${r.message}`);
    });
})();