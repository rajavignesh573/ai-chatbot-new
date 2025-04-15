import { db } from '@/lib/db';
import { messageDeprecated, message, voteDeprecated, vote } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

async function migrateMessages() {
  console.log('Starting message migration...');

  // Get all old messages
  const oldMessages = await db.select().from(messageDeprecated);
  console.log(`Found ${oldMessages.length} messages to migrate`);

  for (const oldMessage of oldMessages) {
    const parts = [];

    // Add text part if content exists
    if (oldMessage.content) {
      parts.push({
        type: 'text',
        text: oldMessage.content,
      });
    }

    // Add reasoning part if it exists
    if (oldMessage.reasoning) {
      parts.push({
        type: 'reasoning',
        reasoning: oldMessage.reasoning,
      });
    }

    // Add tool invocations if they exist
    if (oldMessage.toolInvocations) {
      for (const toolInvocation of oldMessage.toolInvocations) {
        parts.push({
          type: 'tool-invocation',
          toolInvocation,
        });
      }
    }

    // Create new message with parts
    const [newMessage] = await db
      .insert(message)
      .values({
        id: oldMessage.id,
        chatId: oldMessage.chatId,
        role: oldMessage.role,
        parts,
        attachments: oldMessage.experimental_attachments || [],
        createdAt: oldMessage.createdAt,
      })
      .returning();

    console.log(`Migrated message ${oldMessage.id}`);
  }

  console.log('Message migration completed');
}

async function migrateVotes() {
  console.log('Starting vote migration...');

  // Get all old votes
  const oldVotes = await db.select().from(voteDeprecated);
  console.log(`Found ${oldVotes.length} votes to migrate`);

  for (const oldVote of oldVotes) {
    // Create new vote
    await db.insert(vote).values({
      chatId: oldVote.chatId,
      messageId: oldVote.messageId,
      isUpvoted: oldVote.isUpvoted,
    });

    console.log(`Migrated vote for message ${oldVote.messageId}`);
  }

  console.log('Vote migration completed');
}

async function main() {
  try {
    await migrateMessages();
    await migrateVotes();
    console.log('Migration completed successfully');
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  }
}

main(); 