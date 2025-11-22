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
export async function syncAddressBook(cb: (s: SyncCb) => void) {
    console.log("Syncing now...");
    let sman = new SettingsManager();
    await sman.loadConfig();
    if (!sman.settings.targetAddressBook) {
        cb(new SyncCb(0, 0, `Error: No target Address Book configured. (Config: "${JSON.stringify(sman.settings)}")`));
        return;
    }
    let address_book = await browser.addressBooks.get(sman.settings.targetAddressBook);
    console.log("Using Address Book:", address_book);
    console.log("Read-only:", address_book.readOnly);
    if (address_book.readOnly) {
        cb(new SyncCb(0, 0, `Error: Target Address Book "${address_book.name}" is read-only.`));
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
    if (sman.settings.syncAllFolders) {
        target_folders = all_folders;
    } else {
        for (let sf of sman.settings.syncedFolders) {
            const match = all_folders.find(f => f.path === sf.path && f.accountId === sf.accountId);
            if (match) {
                target_folders.push(match);
            }
        }
    }
    cb(new SyncCb(0, 0, `Starting sync of ${target_folders.length} folders...`));
    for (let [i, folder] of target_folders.entries()) {
        console.log(`Syncing folder: ${folder.name} (${folder.path})`);
        cb(new SyncCb(i, i / target_folders.length, `(${i}/${target_folders.length}) ${folder.path} (starting...)`));
        let msgCount = 0;
        let messages = listMessages(folder);
        for await (let message of messages) {
            let mail_addresses = extractAddressesFromMsg(message);
            console.log(`  Message ${++msgCount}: found addresses:`, mail_addresses);
            for (let email of mail_addresses) {
                try {
                    const email_prop = new EmailProperty(
                        [new PrefParameter(new IntegerType(1))],
                        new TextType(email.email),
                    );
                    const fn = new FNProperty([], new TextType(email.name || email.email));

                    const vcard = new VCARD([
                        fn, email_prop
                    ]);
                    // check if mail address already exists
                    const existing = await browser.contacts.quickSearch(address_book.id, {
                        searchString: email.email,
                    });
                    if (existing.length > 0) {
                        console.log(`Address ${email.email} already exists in address book "${address_book.name}", skipping.`);
                        continue;
                    }
                    await browser.contacts.create(address_book.id, {
                        vCard: vcard.repr()
                    });
                } catch (e) {
                    cb(new SyncCb(i, i / target_folders.length, `(${i}/${target_folders.length}) ${folder.path} (error adding ${email}: ${e})`));
                }

            }
        }
    }
    cb(new SyncCb(target_folders.length, 1, `Sync completed.`));

}