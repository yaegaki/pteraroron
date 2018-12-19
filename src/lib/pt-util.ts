import { Page } from "puppeteer";
import * as puppeteer from 'puppeteer-core';
import { getChromePath } from "./get-chromepath";

/**
 * 何回呼んでも大丈夫なexposeFunction
 * @param page 
 * @param name 
 * @param func 
 */
export async function safeExposeFunction<T>(page: Page, name: string, func: (...args: any[]) => any) {
    const defined = await page.evaluate(name =>  window[name] !== undefined, name);
    if (!defined) {
        await page.exposeFunction(name, func);
    }
}

/**
 * ブラウザを立ち上げてページを取得する
 */
export async function createPage(): Promise<Page> {
    const browser = await puppeteer.launch({
        executablePath: getChromePath(),
        headless: false,
        devtools: true,
    });

    return (await browser.pages())[0];
}