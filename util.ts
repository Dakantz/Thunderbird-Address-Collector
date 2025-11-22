

export function extractMailsFromMsg(message: browser.messages.MessageHeader): string[] {
    const emailRegex = /[^@]+@[^@]+/;
    const emails: string[] = [];
    emails.push(message.author);
    emails.push(...message.recipients);
    emails.push(...message.ccList);
    emails.push(...message.bccList);
    return emails
        .map(email => {
            const match = email.match(emailRegex);
            return match ? match[0] : null;
        })
        .filter((email): email is string => email !== null);
}