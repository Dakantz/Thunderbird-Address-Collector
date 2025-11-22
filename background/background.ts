/// <reference types="thunderbird-webext-browser" />

import { Syncer } from "../utils/syncer";
import { SettingsManager } from "../utils/util";



browser.messages.onNewMailReceived.addListener(async (folder: browser.folders.MailFolder, messages: browser.messages.MessageList) => {
  console.log(`New mail received in folder: ${folder.name}`);
  let sman = new SettingsManager();
  await sman.loadConfig();
  if (!sman.settings.autoSync) {
    console.log("AutoSync is disabled in settings. Skipping sync.");
    return;
  }
  let syncer = new Syncer();

  messages.messages.forEach(async (messageHeader) => {
    console.log(`Processing new message: ${messageHeader.subject}`);
    await syncer.syncSingleMessage(messageHeader.id);
  });
});