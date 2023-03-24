import login, { AppstateData, IFCAU_Options } from '@xaviabot/fca-unofficial';
import { Express } from 'express';
import createHttpsServer from './server.js';

declare function getAppstate(EState: string, secret: string): AppstateData;

interface Plugin {
    name: string;
    version?: string;
    onCall: () => void;
}

export class MSGStore {
    #plugins: Plugin[];
    constructor() {
        this.#plugins = [];
    }

    openServer(port: number = 3001, app?: Express) {
        createHttpsServer(port, app);
    }

    async loginWithEmail(email: string, password: string, options: Partial<IFCAU_Options>) {
        return login({ email, password }, { pauseLog: true, ...options })
            .then(api => { });
    }

    async loginWithAppState(EState: string, secret: string, options: Partial<IFCAU_Options>) {
        const appState = getAppstate(EState, secret);
        return login({ appState }, { pauseLog: true, ...options })
            .then(api => { });
    }
}
