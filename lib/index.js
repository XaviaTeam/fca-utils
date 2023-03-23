import login from '@xaviabot/fca-unofficial';
export class MSGStore {
    #plugins;
    constructor() {
        this.#plugins = [];
    }
    async loginWithEmail(email, password, options) {
        return login({ email, password }, { pauseLog: true, ...options })
            .then(api => { });
    }
    async loginWithAppState(EState, secret, options) {
        const appState = getAppstate(EState, secret);
        return login({ appState }, { pauseLog: true, ...options })
            .then(api => { });
    }
}
