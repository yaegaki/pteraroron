import { readdirSync, existsSync, readFileSync, mkdirSync, writeFileSync } from "fs";
import { LiveChatLogInfo } from "./lib/dig-chat";
import { parseChat } from "./lib/parse-chat";

/**
 * ./videoフォルダ内に保存されたLiveChatに含まれるテキストデータを
 * ./messageフォルダに保存する。
 * ファイル名は${videoid}.txtとなる。
 */

 const videos = readdirSync('./video');
 videos.forEach(videoId => {
     const infoPath = `video/${videoId}/chat/top/info.json`;
     if (!existsSync(infoPath)) return;

     if (!existsSync('message')) {
         mkdirSync('message');
     }
     const outputPath = `message/${videoId}.txt`

     try
     {
        const info: LiveChatLogInfo = JSON.parse(readFileSync(infoPath, 'utf-8'))
        const encoded = parseChat(info);
        const message = encoded.records.map(r => r.message).join('\n');
        writeFileSync(outputPath, message);
        console.log(`${videoId} done.`);
     }
     catch (e)
     {
         console.log(`${videoId} failed.`)
         console.error(e);
     }
 });