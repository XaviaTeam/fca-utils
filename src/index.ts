import login, { AppstateData, IFCAU_Options } from '@xaviabot/fca-unofficial';

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
