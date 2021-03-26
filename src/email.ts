import { Client, Message } from 'postmark';
import { LinkTrackingOptions } from 'postmark/dist/client/models/message/SupportingTypes';
import { InboundMessageDetails } from 'postmark/dist/client/models/messages/InboundMessage';
import { chunkArray } from './utils';
import { getUsersForRole, getRolesByUsername, User } from './account';
import config from './config';

const client = new Client(config.postmark.apiToken);

function renderTemplate(template: string, user: User): string {
  return template
    .replace(/{{name}}/g, user.name)
    .replace(/{{givenName}}/g, user.givenName)
    .replace(/{{familyName}}/g, user.familyName);
}

function inboundEmailToOutboundEmail(
  inbound: InboundMessageDetails,
  to: User,
  from: string,
  stream?: string | undefined | null,
): Message {
  const m = new Message(
    from,
    renderTemplate(inbound.Subject, to),
    renderTemplate(inbound.HtmlBody, to),
    renderTemplate(inbound.TextBody, to),
    `"${to.name}" <${to.email}>`,
    undefined,
    undefined,
    undefined,
    undefined,
    false,
    LinkTrackingOptions.None,
    undefined,
    inbound.Attachments,
  );
  m.MessageStream = stream || config.postmark.messageStream;
  return m;
}

export async function forwardEmail(inbound: InboundMessageDetails): Promise<void> {
  const { domain } = config.postmark;
  const [fromMailbox, fromDomain] = inbound.From.split('@', 2);
  const [toMailboxDotPlus] = inbound.OriginalRecipient.split('@', 2);
  const [toMailboxDot, overrideFromMailbox] = toMailboxDotPlus.split('+', 2);
  const [toMailbox, messageStream] = toMailboxDot.split('.', 2);

  if (!toMailbox) throw Error(`No to mailbox specified`);
  if (fromDomain !== domain) throw Error(`Sender domain ${fromDomain} was not allowed.`);
  const roles = await getRolesByUsername(fromMailbox);
  if (roles.filter((r) => config.account.allowedRoles.includes(r)).length === 0) {
    throw Error(`Sender ${fromMailbox} was not allowed.`);
  }

  const toUsers = await getUsersForRole(toMailbox);
  const from = overrideFromMailbox ? `${overrideFromMailbox}@${domain}` : inbound.From;
  const messages = toUsers.map((to) => inboundEmailToOutboundEmail(
    inbound,
    to,
    from,
    messageStream,
  ));

  // eslint-disable-next-line no-console
  console.log(`Sending message "${inbound.Subject}" from ${from} to ${toUsers.length} people...`);

  // Send the emails
  const errors = [];
  let count = 0;
  for (const batch of chunkArray<Message>(messages, 10)) {
    // Send the actual email:
    // eslint-disable-next-line no-await-in-loop
    const results = await client.sendEmailBatch(batch);

    // Error handling:
    const thisErrors = results.filter(({ ErrorCode }: any) => ErrorCode !== 0);
    if (thisErrors) {
      errors.push(...thisErrors);
      // eslint-disable-next-line no-console
      thisErrors.forEach(console.error);
    }

    // Status reporting:
    count += batch.length;
    // eslint-disable-next-line no-console
    console.log(`...${count} done`);
  }
  // eslint-disable-next-line no-console
  console.log(`...fully sent!`);

  // Send status message:
  const errorsString = errors.map(({ To, Message }: any) => `${To}: ${Message}`).join(`\n`);
  await client.sendEmail(new Message(
    `account@${domain}`,
    `[SENT] ${inbound.Subject}`,
    undefined,
    `Message was sent to ${toUsers.length} people with ${errors.length} errors.\n\n${errorsString}`,
    inbound.From,
  ));
}
