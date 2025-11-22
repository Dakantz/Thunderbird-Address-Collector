/// <reference types="thunderbird-webext-browser" />

import { extractMailsFromMsg } from "../util"
browser.messages.onNewMailReceived.addListener((folder: browser.folders.MailFolder, messages: browser.messages.MessageList) => {
  console.log(`New mail received in folder: ${folder.name}`);
  messages.messages.forEach(async (messageHeader) => {
    const emails = extractMailsFromMsg(messageHeader);
    console.log(`Extracted emails from message ID ${messageHeader.id}:`, emails);
  });

});
browser.runtime.onStartup.addListener(() => {
  console.log("Background script started on startup!");
});