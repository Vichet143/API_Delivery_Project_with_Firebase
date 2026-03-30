import admin, { db } from "../config/firebase";

export interface ChatInput {
  user_id: string;
  transporter_id: string;
  messages: string;
}

interface ChatDocument extends ChatInput {
  date: FirebaseFirestore.FieldValue;
}

export async function chat(input: ChatInput) {
  const createchat: ChatDocument = {
    user_id: input.user_id,
    transporter_id: input.transporter_id,
    messages: input.messages,
    date: admin.firestore.FieldValue.serverTimestamp(),
  };

  const docChat = await db.collection("chat").add(createchat);

  return {
    id: docChat.id,
    ...createchat,
  };
}
