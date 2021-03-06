import { LiveChatContinuationAction } from './yt';
import { LiveChatLogInfo } from './dig-chat';
import * as fs from 'fs';

/**
 * 使いやすい形に加工したチャットのデータ
 */
export interface EncodedLiveChatData {
    records: EncodedLiveChatRecord[];
}

export interface EncodedLiveChatRecord {
    author: string;
    message: string;
    offsetMsec: number;
}

export function parseChat(info: LiveChatLogInfo): EncodedLiveChatData {
    // 重複チェック用
    const map = {};

    const records: EncodedLiveChatRecord[] = [];
    info.records.forEach(r => {
        const file = fs.readFileSync(`${info.baseDir}/${r.filename}`, 'utf-8');
        const actions: LiveChatContinuationAction[] = JSON.parse(file);
        if (actions == null) {
            console.log(r.filename);
            console.log(file);
        }
        actions.forEach(act => {
            act.replayChatItemAction.actions.forEach(cact => {
                if (cact.addChatItemAction === undefined) return;

                const r = cact.addChatItemAction.item.liveChatTextMessageRenderer;
                if (r === undefined) return;

                let message: string;
                if (r.message.simpleText === undefined) {
                    if (r.message.runs === undefined) {
                        return;
                    }

                    message = r.message.runs.map(o => o.text).join();
                }
                else {
                    message = r.message.simpleText;
                }

                if (map[r.id] === undefined) {
                    map[r.id] = r;
                    records.push({
                        author: r.authorName.simpleText,
                        message: message,
                        offsetMsec: Number(act.replayChatItemAction.videoOffsetTimeMsec),
                    });
                }
            });
        });
    });


    records.sort((a, b) => {
        if (a.offsetMsec < b.offsetMsec) return -1;
        if (a.offsetMsec > b.offsetMsec) return 1;
        return 0;
    });

    return {
        records,
    };
}