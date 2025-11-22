
/// <reference types="thunderbird-webext-browser" />
//https://thunderbird-webextension-apis.readthedocs.io/en/91/how-to/messageLists.html
export async function* listMessages(folder: browser.folders.MailFolder): AsyncGenerator<browser.messages.MessageHeader> {
    let page = await messenger.messages.list(folder);
    for (let message of page.messages) {
        yield message;
    }

    while (page.id) {
        page = await messenger.messages.continueList(page.id);
        for (let message of page.messages) {
            yield message;
        }
    }
}

export function extractAddressesFromMsg(message: browser.messages.MessageHeader) {
    const emailRegex = /[^@]+@[^@]+/;
    const emails: string[] = [];
    emails.push(message.author);
    emails.push(...message.recipients);
    emails.push(...message.ccList);
    emails.push(...message.bccList);
    console.log("Extracted emails before filtering:", emails);
    return emails
        .map(email => {
            const match_angles = email.match(/([^><]+) <([^>]+)>/);
            if (match_angles) {
                return {
                    name: match_angles[1].trim(),
                    email: match_angles[2].trim()
                }
            }
            return { name: email, email: email.trim() };
        })
}

export class SyncedFolder {
    constructor(
        public path: string,
        public accountId: browser.accounts.MailAccountId,
        public lastSync: number = -1,
    ) {
        if (!accountId) {
            this.accountId = "-unknown-";
        }

    }
}
export class Settings {
    constructor(
        public syncAllFolders: boolean,
        public syncedFolders: SyncedFolder[],
        public syncIntervalMinutes: number,
        public autoSync: boolean,
        public targetAddressBook?: string,
    ) { }
}
export class SettingsManager {
    settings: Settings;
    constructor() {
        this.settings = new Settings(
            false,
            [],
            15,
            true
        );
    }
    saveConfig() {
        browser.storage.sync.set(
            { [`${browser.runtime.id}-settings`]: JSON.stringify(this.settings) }
        )
    }
    async loadConfig() {
        const result = await browser.storage.sync.get(`${browser.runtime.id}-settings`);
        console.log("Loaded settings:", result);
        if (result[`${browser.runtime.id}-settings`]) {
            this.settings = JSON.parse(result[`${browser.runtime.id}-settings`]);
        }
    }
}