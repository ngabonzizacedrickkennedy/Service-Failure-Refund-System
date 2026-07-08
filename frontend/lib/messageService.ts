import executionApi from "./executionApi";

export interface MessageResponse {
  id: string;
  conversationId: string;
  senderId: string;
  senderName: string;
  recipientId: string;
  text: string;
  sentAt: string;
}

export const messageService = {
  async sendMessage(recipientId: string, text: string): Promise<MessageResponse> {
    const res = await executionApi.post<MessageResponse>("/api/messages", { recipientId, text });
    return res.data;
  },

  async getConversation(otherUserId: string): Promise<MessageResponse[]> {
    const res = await executionApi.get<MessageResponse[]>(`/api/messages/conversation/${otherUserId}`);
    return res.data;
  },

  async getLatestConversations(): Promise<MessageResponse[]> {
    const res = await executionApi.get<MessageResponse[]>("/api/messages/conversations");
    return res.data;
  },
};
