import { readdirSync, existsSync, readFileSync, mkdirSync, writeFileSync, writeFile } from "fs";


const videos = readdirSync('./video');
const allSummaries: any[] = [];

if (!existsSync('summary')) {
    mkdirSync('summary');
}
videos.forEach(videoId => {
    const infoPath = `video/${videoId}/summary.json`;
    if (!existsSync(infoPath)) return;
    const outputPath = `summary/${videoId}.json`

    try {
        const str = readFileSync(infoPath, 'utf-8');
        allSummaries.push(JSON.parse(str));
        writeFileSync(outputPath, str);
        console.log(`${videoId} done.`);
    }
    catch (e) {
        console.error(e);
    }
});

writeFileSync('summary/all.json', JSON.stringify(allSummaries));