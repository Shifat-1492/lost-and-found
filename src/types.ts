/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface User {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'user';
  avatarUrl?: string;
  totalPosts?: number;
}

export interface Item {
  id: string;
  title: string;
  description: string;
  category: string;
  location: string;
  type: 'lost' | 'found';
  imageUrl?: string;
  status: 'pending' | 'approved' | 'rejected';
  datePosted: string;
  userId: string;
  userName: string;
  userEmail: string;
}

export interface Chat {
  id: string;
  itemId: string;
  itemTitle: string;
  itemType: 'lost' | 'found';
  itemImageUrl?: string;
  userIds: string[]; // [buyerId, sellerId]
  participants: {
    id: string;
    name: string;
    email: string;
  }[];
  lastMessage?: string;
  lastMessageTime?: string;
}

export interface Message {
  id: string;
  chatId: string;
  senderId: string;
  senderName: string;
  content: string;
  timestamp: string;
}

export interface AppStats {
  total: number;
  pending: number;
  approved: number;
  rejected: number;
}
