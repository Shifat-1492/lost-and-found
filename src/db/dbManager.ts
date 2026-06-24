import mongoose from 'mongoose';
import fs from 'fs';
import path from 'path';
import { User, Item, Chat, Message } from '../types';

// Constants for local JSON storage fallback
const DATA_DIR = path.join(process.cwd(), 'data');
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

const USERS_FILE = path.join(DATA_DIR, 'users.json');
const ITEMS_FILE = path.join(DATA_DIR, 'items.json');
const CHATS_FILE = path.join(DATA_DIR, 'chats.json');
const MESSAGES_FILE = path.join(DATA_DIR, 'messages.json');

// Mongoose Schema Definitions
const UserSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  role: { type: String, enum: ['admin', 'user'], default: 'user' },
  avatarUrl: { type: String }
}, { timestamps: true });

const ItemSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  title: { type: String, required: true },
  description: { type: String, required: true },
  category: { type: String, required: true },
  location: { type: String, required: true },
  type: { type: String, enum: ['lost', 'found'], required: true },
  imageUrl: { type: String },
  status: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending' },
  datePosted: { type: String, required: true },
  userId: { type: String, required: true },
  userName: { type: String, required: true },
  userEmail: { type: String, required: true }
}, { timestamps: true });

const ParticipantSchema = new mongoose.Schema({
  id: { type: String, required: true },
  name: { type: String, required: true },
  email: { type: String }
}, { _id: false });

const ChatSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  itemId: { type: String, required: true },
  itemTitle: { type: String, required: true },
  itemType: { type: String, enum: ['lost', 'found'], required: true },
  itemImageUrl: { type: String },
  userIds: [{ type: String }],
  participants: [ParticipantSchema],
  lastMessage: { type: String },
  lastMessageTime: { type: String }
}, { timestamps: true });

const MessageSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  chatId: { type: String, required: true },
  senderId: { type: String, required: true },
  senderName: { type: String, required: true },
  content: { type: String, required: true },
  timestamp: { type: String, required: true }
}, { timestamps: true });

let UserModel: mongoose.Model<any>;
let ItemModel: mongoose.Model<any>;
let ChatModel: mongoose.Model<any>;
let MessageModel: mongoose.Model<any>;

let isMongoConnected = false;

// Initialize models safely (avoid overwrite errors in case of HMR/multiple loads)
try {
  UserModel = mongoose.model('User', UserSchema);
} catch {
  UserModel = mongoose.model('User');
}

try {
  ItemModel = mongoose.model('Item', ItemSchema);
} catch {
  ItemModel = mongoose.model('Item');
}

try {
  ChatModel = mongoose.model('Chat', ChatSchema);
} catch {
  ChatModel = mongoose.model('Chat');
}

try {
  MessageModel = mongoose.model('Message', MessageSchema);
} catch {
  MessageModel = mongoose.model('Message');
}

// Local helper to read JSON file
function readLocalFile<T>(filePath: string, defaultData: T): T {
  try {
    if (!fs.existsSync(filePath)) {
      fs.writeFileSync(filePath, JSON.stringify(defaultData, null, 2));
      return defaultData;
    }
    const data = fs.readFileSync(filePath, 'utf-8');
    return JSON.parse(data) as T;
  } catch (error) {
    console.error(`Error reading ${filePath}:`, error);
    return defaultData;
  }
}

// Local helper to write JSON file
function writeLocalFile<T>(filePath: string, data: T): void {
  try {
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
  } catch (error) {
    console.error(`Error writing ${filePath}:`, error);
  }
}

// Check MongoDB connection & Seed initially if MongoDB is empty
export async function initializeDatabase(
  defaultUsers: User[],
  defaultItems: Item[],
  defaultChats: Chat[],
  defaultMessages: Message[]
) {
  const mongoUri = process.env.MONGODB_URI;
  if (!mongoUri) {
    console.log('Database Info: MONGODB_URI not found. Using local JSON file storage.');
    isMongoConnected = false;
    return;
  }

  try {
    console.log('Database Info: Connecting to MongoDB Atlas...');
    await mongoose.connect(mongoUri, {
      serverSelectionTimeoutMS: 5000,
    });
    isMongoConnected = true;
    console.log('Database Info: Connected to MongoDB Atlas successfully.');

    // Seed users if empty
    const userCount = await UserModel.countDocuments();
    if (userCount === 0) {
      console.log('Database Info: MongoDB Users collection is empty. Seeding default/local users...');
      const localUsers = readLocalFile<User[]>(USERS_FILE, defaultUsers);
      await UserModel.insertMany(localUsers);
    }

    // Seed items if empty
    const itemCount = await ItemModel.countDocuments();
    if (itemCount === 0) {
      console.log('Database Info: MongoDB Items collection is empty. Seeding default/local items...');
      const localItems = readLocalFile<Item[]>(ITEMS_FILE, defaultItems);
      await ItemModel.insertMany(localItems);
    }

    // Seed chats if empty
    const chatCount = await ChatModel.countDocuments();
    if (chatCount === 0) {
      console.log('Database Info: MongoDB Chats collection is empty. Seeding default/local chats...');
      const localChats = readLocalFile<Chat[]>(CHATS_FILE, defaultChats);
      await ChatModel.insertMany(localChats);
    }

    // Seed messages if empty
    const messageCount = await MessageModel.countDocuments();
    if (messageCount === 0) {
      console.log('Database Info: MongoDB Messages collection is empty. Seeding default/local messages...');
      const localMessages = readLocalFile<Message[]>(MESSAGES_FILE, defaultMessages);
      await MessageModel.insertMany(localMessages);
    }

  } catch (err) {
    console.error('Database Error: MongoDB Atlas connection failed. Falling back to local JSON file storage.', err);
    isMongoConnected = false;
  }
}

export function isUsingMongo(): boolean {
  return isMongoConnected;
}

// --- DATABASE ACCESS API ---

// 1. USERS
export async function getUsers(fallbackData: User[]): Promise<User[]> {
  if (isMongoConnected) {
    const mongoUsers = await UserModel.find({});
    return mongoUsers.map(doc => ({
      id: doc.id,
      name: doc.name,
      email: doc.email,
      role: doc.role,
      avatarUrl: doc.avatarUrl
    }));
  }
  return readLocalFile<User[]>(USERS_FILE, fallbackData);
}

export async function saveUser(user: User, fallbackData: User[]): Promise<void> {
  if (isMongoConnected) {
    await UserModel.findOneAndUpdate(
      { id: user.id },
      user,
      { upsert: true, new: true }
    );
    return;
  }
  const users = readLocalFile<User[]>(USERS_FILE, fallbackData);
  const idx = users.findIndex(u => u.id === user.id);
  if (idx !== -1) {
    users[idx] = user;
  } else {
    users.push(user);
  }
  writeLocalFile(USERS_FILE, users);
}

// 2. ITEMS
export async function getItems(fallbackData: Item[]): Promise<Item[]> {
  if (isMongoConnected) {
    const mongoItems = await ItemModel.find({});
    return mongoItems.map(doc => ({
      id: doc.id,
      title: doc.title,
      description: doc.description,
      category: doc.category,
      location: doc.location,
      type: doc.type,
      imageUrl: doc.imageUrl,
      status: doc.status,
      datePosted: doc.datePosted,
      userId: doc.userId,
      userName: doc.userName,
      userEmail: doc.userEmail
    }));
  }
  return readLocalFile<Item[]>(ITEMS_FILE, fallbackData);
}

export async function saveItem(item: Item, fallbackData: Item[]): Promise<void> {
  if (isMongoConnected) {
    await ItemModel.findOneAndUpdate(
      { id: item.id },
      item,
      { upsert: true, new: true }
    );
    return;
  }
  const items = readLocalFile<Item[]>(ITEMS_FILE, fallbackData);
  const idx = items.findIndex(i => i.id === item.id);
  if (idx !== -1) {
    items[idx] = item;
  } else {
    items.push(item);
  }
  writeLocalFile(ITEMS_FILE, items);
}

export async function updateItemStatus(id: string, status: 'pending' | 'approved' | 'rejected', fallbackData: Item[]): Promise<Item | null> {
  if (isMongoConnected) {
    const doc = await ItemModel.findOneAndUpdate(
      { id },
      { status },
      { new: true }
    );
    if (!doc) return null;
    return {
      id: doc.id,
      title: doc.title,
      description: doc.description,
      category: doc.category,
      location: doc.location,
      type: doc.type,
      imageUrl: doc.imageUrl,
      status: doc.status,
      datePosted: doc.datePosted,
      userId: doc.userId,
      userName: doc.userName,
      userEmail: doc.userEmail
    };
  }
  const items = readLocalFile<Item[]>(ITEMS_FILE, fallbackData);
  const idx = items.findIndex(i => i.id === id);
  if (idx === -1) return null;
  items[idx].status = status;
  writeLocalFile(ITEMS_FILE, items);
  return items[idx];
}

export async function deleteItem(id: string, fallbackData: Item[]): Promise<boolean> {
  if (isMongoConnected) {
    const res = await ItemModel.deleteOne({ id });
    return (res.deletedCount ?? 0) > 0;
  }
  const items = readLocalFile<Item[]>(ITEMS_FILE, fallbackData);
  const idx = items.findIndex(i => i.id === id);
  if (idx === -1) return false;
  items.splice(idx, 1);
  writeLocalFile(ITEMS_FILE, items);
  return true;
}

// 3. CHATS
export async function getChats(fallbackData: Chat[]): Promise<Chat[]> {
  if (isMongoConnected) {
    const mongoChats = await ChatModel.find({});
    return mongoChats.map(doc => ({
      id: doc.id,
      itemId: doc.itemId,
      itemTitle: doc.itemTitle,
      itemType: doc.itemType,
      itemImageUrl: doc.itemImageUrl,
      userIds: doc.userIds,
      participants: doc.participants,
      lastMessage: doc.lastMessage,
      lastMessageTime: doc.lastMessageTime
    }));
  }
  return readLocalFile<Chat[]>(CHATS_FILE, fallbackData);
}

export async function saveChat(chat: Chat, fallbackData: Chat[]): Promise<void> {
  if (isMongoConnected) {
    await ChatModel.findOneAndUpdate(
      { id: chat.id },
      chat,
      { upsert: true, new: true }
    );
    return;
  }
  const chats = readLocalFile<Chat[]>(CHATS_FILE, fallbackData);
  const idx = chats.findIndex(c => c.id === chat.id);
  if (idx !== -1) {
    chats[idx] = chat;
  } else {
    chats.push(chat);
  }
  writeLocalFile(CHATS_FILE, chats);
}

// 4. MESSAGES
export async function getMessages(fallbackData: Message[]): Promise<Message[]> {
  if (isMongoConnected) {
    const mongoMsgs = await MessageModel.find({});
    return mongoMsgs.map(doc => ({
      id: doc.id,
      chatId: doc.chatId,
      senderId: doc.senderId,
      senderName: doc.senderName,
      content: doc.content,
      timestamp: doc.timestamp
    }));
  }
  return readLocalFile<Message[]>(MESSAGES_FILE, fallbackData);
}

export async function saveMessage(message: Message, fallbackData: Message[]): Promise<void> {
  if (isMongoConnected) {
    await MessageModel.findOneAndUpdate(
      { id: message.id },
      message,
      { upsert: true, new: true }
    );
    return;
  }
  const messages = readLocalFile<Message[]>(MESSAGES_FILE, fallbackData);
  const idx = messages.findIndex(m => m.id === message.id);
  if (idx !== -1) {
    messages[idx] = message;
  } else {
    messages.push(message);
  }
  writeLocalFile(MESSAGES_FILE, messages);
}

export async function clearMessages(chatId: string, fallbackData: Message[], fallbackChats: Chat[]): Promise<number> {
  if (isMongoConnected) {
    const deleteRes = await MessageModel.deleteMany({ chatId });
    await ChatModel.findOneAndUpdate(
      { id: chatId },
      { lastMessage: 'Chat history cleared', lastMessageTime: new Date().toISOString() }
    );
    return deleteRes.deletedCount ?? 0;
  }

  // Fallback
  const messages = readLocalFile<Message[]>(MESSAGES_FILE, fallbackData);
  const initialLen = messages.length;
  const remaining = messages.filter(msg => msg.chatId !== chatId);
  writeLocalFile(MESSAGES_FILE, remaining);
  
  // Update parents reference if in-memory update is triggered elsewhere, 
  // but since dbManager handles persistent state, writing it back is correct.
  const chats = readLocalFile<Chat[]>(CHATS_FILE, fallbackChats);
  const cIdx = chats.findIndex(c => c.id === chatId);
  if (cIdx !== -1) {
    chats[cIdx].lastMessage = 'Chat history cleared';
    chats[cIdx].lastMessageTime = new Date().toISOString();
    writeLocalFile(CHATS_FILE, chats);
  }

  return initialLen - remaining.length;
}
