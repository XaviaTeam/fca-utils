import { AppstateData } from "@xaviabot/fca-unofficial";

/**
 * base64 encoded utf8 string 
 * 
 * @param str - base64 encoded string
 * @returns utf8 string
 */
export function base64Decode(str: string) {
    return Buffer.from(str, 'base64').toString('utf8');
}

export function getAppstate(EState: string): AppstateData {
    return JSON.parse(base64Decode(EState));
}
