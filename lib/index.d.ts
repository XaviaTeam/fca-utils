import { IFCAU_Options } from '@xaviabot/fca-unofficial';
export declare class MSGStore {
    #private;
    constructor();
    loginWithEmail(email: string, password: string, options: Partial<IFCAU_Options>): Promise<void>;
    loginWithAppState(EState: string, secret: string, options: Partial<IFCAU_Options>): Promise<void>;
}
//# sourceMappingURL=index.d.ts.map