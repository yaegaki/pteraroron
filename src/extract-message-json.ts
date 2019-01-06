import { readdirSync, existsSync, readFileSync, mkdirSync, writeFileSync } from "fs";
import { LiveChatLogInfo } from "./lib/dig-chat";
import { parseChat } from "./lib/parse-chat";

/**
 * extract-messageのjson出力版
 * json版は時間の情報も一緒に出力する
 * ファイル名は${videoid}.json
 */

 const videos = readdirSync('./video');
 videos.forEach(videoId => {
     const infoPath = `video/${videoId}/chat/top/info.json`;
     if (!existsSync(infoPath)) return;

     if (!existsSync('message')) {
         mkdirSync('message');
     }
     const outputPath = `message/${videoId}.json`
     if (existsSync(outputPath)) {
        console.log(`${videoId} skipped.`);
        return;
     }

     try
     {
        const info: LiveChatLogInfo = JSON.parse(readFileSync(infoPath, 'utf-8'))
        const encoded = parseChat(info);
        const messages = encoded.records.map(r => {
            return { message: r.message, offsetMsec: r.offsetMsec };
        });
        writeFileSync(outputPath, JSON.stringify(messages));
        console.log(`${videoId} done.`);
     }
     catch (e)
     {
         console.log(`${videoId} failed.`)
         console.error(e);
     }
 });