/// <reference types="thunderbird-webext-browser" />

import { extractAddressesFromMsg, listMessages, SettingsManager } from "./util";
import { EmailProperty, FNProperty, IntegerType, PrefParameter, TextType, VCARD } from "vcard4";


export class SyncCb {
    constructor(
        public folderCount: number,
        public percentage: number,
        public msg: string
    ) { }
}

export class Syncer {
    sman: SettingsManager;
    sync_folders: browser.folders.MailFolder[] = [];
    sync_address_book?: browser.addressBooks.AddressBookNode;
    target_folders: browser.folders.MailFolder[] = [];

    constructor(private cb?: (s: SyncCb) => void) {
        this.sman = new SettingsManager();


    }
    progressUpdate(percentage: number, msg: string) {
        if (this.cb)
            this.cb(new SyncCb(this.target_folders.length, percentage, msg));
    }
    private async initialize() {
        await this.sman.loadConfig();
        if (!this.sman.settings.targetAddressBook) {
            throw new Error(`Error: No target Address Book configured. (Config: "${JSON.stringify(this.sman.settings)}")`);
        }
        this.sync_address_book = await browser.addressBooks.get(this.sman.settings.targetAddressBook);
        if (this.sync_address_book.readOnly) {
            throw new Error(`Error: Target Address Book "${this.sync_address_book.name}" is read-only.`);
        }
        console.log("Using Address Book:", this.sync_address_book);
        console.log("Read-only:", this.sync_address_book.readOnly);
        if (this.sync_address_book.readOnly) {
            this.progressUpdate(0, `Error: Target Address Book "${this.sync_address_book.name}" is read-only.`);
            return;
        }
        let all_folders = [] as browser.folders.MailFolder[];
        async function getSubfolders(folder: browser.folders.MailFolder): Promise<browser.folders.MailFolder[]> {
            let folders: browser.folders.MailFolder[] = [folder];
            if (folder.subFolders) {
                for (let sub of folder.subFolders) {
                    folders = folders.concat(await getSubfolders(sub));
                }
            }
            return folders;
        }

        const accounts = await browser.accounts.list();
        for (let account of accounts) {
            const rootFolders = account.folders;
            if (!rootFolders) continue;
            for (let rootFolder of rootFolders) {
                const subfolders = await getSubfolders(rootFolder);
                all_folders = all_folders.concat(subfolders);
            }
        }
        let target_folders = [] as browser.folders.MailFolder[];
        if (this.sman.settings.syncAllFolders) {
            target_folders = all_folders;
        } else {
            for (let sf of this.sman.settings.syncedFolders) {
                const match = all_folders.find(f => f.path === sf.path && f.accountId === sf.accountId);
                if (match) {
                    target_folders.push(match);
                }
            }
        }
        this.target_folders = target_folders;
        this.progressUpdate(0, `Starting sync of ${target_folders.length} folders...`);
    }
    private async syncMessage(message: browser.messages.MessageHeader) {
        if (!this.sync_address_book) {
            throw new Error("Sync address book not initialized.");
        }
        let mail_addresses = extractAddressesFromMsg(message);
        console.log("Extracted mail addresses:", mail_addresses);
        for (let email of mail_addresses) {
            const email_prop = new EmailProperty(
                [new PrefParameter(new IntegerType(1))],
                new TextType(email.email),
            );
            const fn = new FNProperty([], new TextType(email.name || email.email));

            const vcard = new VCARD([
                fn, email_prop
            ]);
            // check if mail address already exists
            const existing = await browser.contacts.quickSearch(this.sync_address_book.id, {
                searchString: email.email,
            });
            if (existing.length > 0) {
                console.log(`Address ${email.email} already exists in address book "${this.sync_address_book.name}", skipping.`);
                continue;
            }
            await browser.contacts.create(this.sync_address_book.id, {
                vCard: vcard.repr()
            });
        }
    }
    async syncFull() {
        await this.initialize();
        if (!this.sync_address_book) {
            return;
        }
        this.progressUpdate(0, `Starting sync of ${this.target_folders.length} folders...`);
        for (let [i, folder] of this.target_folders.entries()) {
            console.log(`Syncing folder: ${folder.name} (${folder.path})`);
            this.progressUpdate(i / this.target_folders.length, `(${i}/${this.target_folders.length}) ${folder.path} (starting...)`);
            let msgCount = 0;
            let messages = listMessages(folder);
            for await (let message of messages) {
                await this.syncMessage(message);
            }
        }
        this.progressUpdate(1, `Sync completed.`);
    }
    async syncSingleMessage(messageId: browser.messages.MessageId) {
        await this.initialize();
        if (!this.sync_address_book) {
            return;
        }
        this.progressUpdate(0, `Syncing single message ${messageId}...`);
        const message = await browser.messages.get(messageId);
        await this.syncMessage(message);
        this.progressUpdate(1, `Sync of message ${messageId} completed.`);
    }
}
