import axios from 'axios';
import { createReadStream, existsSync } from 'fs';
import type { Readable, Duplex, Transform } from "stream";

type ReadableStream = Readable | Duplex | Transform

export default async function loadAttachment(imagesSource: string[], skipFailed: boolean): Promise<ReadableStream[]> {

    const readable: ReadableStream[] = [];

    for (const imageSource of imagesSource) {
        const isExists = existsSync(imageSource);

        if (!isExists) {
            try {
                new URL(imageSource);
                readable.push(await axios.get(imageSource, { responseType: 'stream' }).then(res => res.data));
            } catch (err) {
                if (skipFailed) continue;
                if (err instanceof Error && err.message.includes('Invalid URL'))
                    throw new Error("Invalid image source, must be a valid URL or path to the file");
                else throw err;
            }
        } else {
            readable.push(createReadStream(imageSource));
        }
    }

    return readable;
}
