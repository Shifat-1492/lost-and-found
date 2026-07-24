import 'dotenv/config';
import express from 'express';
import path from 'path';
import fs from 'fs';
import { createServer as createViteServer } from 'vite';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import cookieParser from 'cookie-parser';
import mongoose from 'mongoose';
import { Item, User, Chat, Message } from './src/types';

export interface DbUser extends User {
  passwordHash?: string;
}

const JWT_SECRET = process.env.JWT_SECRET || 'secret_fallback_do_not_use_in_prod';
const MONGODB_URI = process.env.MONGODB_URI || '';

// Database models
const userSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  name: String,
  email: { type: String, required: true },
  role: String,
  avatarUrl: String,
  passwordHash: String
});
const UserModel = mongoose.model('User', userSchema);

const itemSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  title: String,
  description: String,
  category: String,
  location: String,
  type: String, // 'lost' | 'found'
  imageUrl: String,
  status: String, // 'pending' | 'approved' | 'rejected'
  datePosted: String,
  userId: String,
  userName: String,
  userEmail: String
});
const ItemModel = mongoose.model('Item', itemSchema);

const chatSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  itemId: String,
  itemTitle: String,
  itemType: String,
  itemImageUrl: String,
  userIds: [String],
  participants: [{ id: String, name: String, email: String }],
  lastMessage: String,
  lastMessageTime: String
});
const ChatModel = mongoose.model('Chat', chatSchema);

const messageSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  chatId: String,
  senderId: String,
  senderName: String,
  content: String,
  timestamp: String
});
const MessageModel = mongoose.model('Message', messageSchema);

// Seed initial dataset if database is empty
async function seedDataIfEmpty() {
  const count = await UserModel.countDocuments();
  if (count > 0) return; // Already seeded

  console.log('Seeding initial data to MongoDB...');
  const defaultPasswordHash = bcrypt.hashSync('password', 10);
  
  const defaultUsers = [
    { id: 'shifat_admin', name: 'Ahmmed Shifat', email: 'ahmmedshifat64649@gmail.com', role: 'admin', avatarUrl: 'https://api.dicebear.com/7.x/initials/svg?seed=Ahmmed%20Shifat', passwordHash: defaultPasswordHash },
    { id: 'admin', name: 'Nafiz Ahmed Emon (Admin)', email: 'admin@example.com', role: 'admin', avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=150', passwordHash: defaultPasswordHash },
    { id: 'user1', name: 'Sarah Jenkins', email: 'sarah@example.com', role: 'user', avatarUrl: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=150', passwordHash: defaultPasswordHash },
    { id: 'user2', name: 'Taj Tarafder', email: 'taj@example.com', role: 'user', avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=150', passwordHash: defaultPasswordHash },
    { id: 'user3', name: 'Akash Ahmed', email: 'akash@example.com', role: 'user', avatarUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&q=80&w=150', passwordHash: defaultPasswordHash },
    { id: 'user4', name: 'Osama Hossain', email: 'osama@example.com', role: 'user', avatarUrl: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&q=80&w=150', passwordHash: defaultPasswordHash }
  ];
  await UserModel.insertMany(defaultUsers);

  const defaultItems = [
    {
      id: 'item1', title: 'Lost Black Wallet', description: 'Black leather wallet with cards, ID, and some cash. Highly sentimental value as it was a gift.',
      category: 'Wallet', location: 'Central Park near the Bethesda Fountain', type: 'lost',
      imageUrl: 'https://images.unsplash.com/photo-1627123424574-724758594e93?auto=format&fit=crop&q=80&w=600',
      status: 'approved', datePosted: '2026-04-08T14:30:00.000Z', userId: 'user1', userName: 'Sarah Jenkins', userEmail: 'sarah@example.com'
    },
    {
      id: 'item2', title: 'Found iPhone 13 Pro', description: 'Found near Times Square station entrance. It is a graphite black color iPhone with a clear hybrid spigen case. Currently turned on but locked.',
      category: 'Phone', location: 'Times Square Subway Station', type: 'found',
      imageUrl: 'https://images.unsplash.com/photo-1510557880182-3d4d3cba35a5?auto=format&fit=crop&q=80&w=600',
      status: 'approved', datePosted: '2026-04-20T09:15:00.000Z', userId: 'user2', userName: 'Taj Tarafder', userEmail: 'taj@example.com'
    },
    {
      id: 'item3', title: 'Lost Toyota Car Keys', description: 'Toyota car key fob with a red customized keychain saying "Adventure". Lost near the Downtown LA Starbucks coffee shop.',
      category: 'Keys', location: 'Downtown LA, near the 5th Ave Starbucks', type: 'lost',
      imageUrl: 'https://images.unsplash.com/photo-1582139329536-e7284fece509?auto=format&fit=crop&q=80&w=600',
      status: 'approved', datePosted: '2026-04-21T18:45:00.000Z', userId: 'user3', userName: 'Akash Ahmed', userEmail: 'akash@example.com'
    },
    {
      id: 'item4', title: 'Found Daffodil University ID Card', description: 'Found a Daffodil International University student ID card belonging to Shyman Tarafder. Found on Sobhanbag campus CSE lab building.',
      category: 'Card', location: 'DIU Campus, Sobhanbag, CSE building 3rd Floor', type: 'found',
      imageUrl: 'https://images.unsplash.com/photo-1593508512255-86ab42a8e620?auto=format&fit=crop&q=80&w=600',
      status: 'approved', datePosted: '2026-04-22T10:00:00.000Z', userId: 'user4', userName: 'Osama Hossain', userEmail: 'osama@example.com'
    }
  ];
  await ItemModel.insertMany(defaultItems);

  const defaultChats = [
    {
      id: 'chat1', itemId: 'item1', itemTitle: 'Lost Black Wallet', itemType: 'lost', itemImageUrl: 'https://images.unsplash.com/photo-1627123424574-724758594e93?auto=format&fit=crop&q=80&w=600',
      userIds: ['user2', 'user1'], participants: [{ id: 'user2', name: 'Taj Tarafder', email: 'taj@example.com' }, { id: 'user1', name: 'Sarah Jenkins', email: 'sarah@example.com' }],
      lastMessage: 'I have the wallet safely stored. I will send you a picture to confirm.', lastMessageTime: '2026-06-23T10:29:00.000Z'
    },
    {
      id: 'chat2', itemId: 'item2', itemTitle: 'Found iPhone 13 Pro', itemType: 'found', itemImageUrl: 'https://images.unsplash.com/photo-1510557880182-3d4d3cba35a5?auto=format&fit=crop&q=80&w=600',
      userIds: ['user1', 'user2'], participants: [{ id: 'user1', name: 'Sarah Jenkins', email: 'sarah@example.com' }, { id: 'user2', name: 'Taj Tarafder', email: 'taj@example.com' }],
      lastMessage: 'Sounds perfect! Let us arrange a secure meeting place.', lastMessageTime: '2026-06-23T10:19:51.000Z'
    }
  ];
  await ChatModel.insertMany(defaultChats);

  const defaultMessages = [
    { id: 'msg1', chatId: 'chat1', senderId: 'user2', senderName: 'Taj Tarafder', content: 'Hi Sarah, is this wallet still lost? I saw something very similar near Bethesda Fountain.', timestamp: '2026-06-23T10:25:00.000Z' },
    { id: 'msg2', chatId: 'chat1', senderId: 'user1', senderName: 'Sarah Jenkins', content: 'Oh my goodness, yes it is! What did it look like?', timestamp: '2026-06-23T10:27:00.000Z' },
    { id: 'msg3', chatId: 'chat1', senderId: 'user2', senderName: 'Taj Tarafder', content: 'I have the wallet safely stored. I will send you a picture to confirm.', timestamp: '2026-06-23T10:29:00.000Z' },
    { id: 'msg4', chatId: 'chat2', senderId: 'user1', senderName: 'Sarah Jenkins', content: 'Hey Taj, is that found iPhone still with you?', timestamp: '2026-06-23T10:15:00.000Z' },
    { id: 'msg5', chatId: 'chat2', senderId: 'user2', senderName: 'Taj Tarafder', content: 'Yes! It’s locked but I’m hoping to find the real owner.', timestamp: '2026-06-23T10:18:00.000Z' },
    { id: 'msg6', chatId: 'chat2', senderId: 'user1', senderName: 'Sarah Jenkins', content: 'Sounds perfect! Let us arrange a secure meeting place.', timestamp: '2026-06-23T10:19:51.000Z' }
  ];
  await MessageModel.insertMany(defaultMessages);
  
  console.log('Seed data inserted.');
}

async function startServer() {
  const app = express();
  app.use(express.json({ limit: '5mb' })); // Increased limit for base64 images
  app.use(cookieParser());
  const PORT = parseInt(process.env.PORT || '3000', 10);

  if (MONGODB_URI) {
    try {
      await mongoose.connect(MONGODB_URI);
      console.log('Connected to MongoDB Atlas.');
      await seedDataIfEmpty();
    } catch (err) {
      console.error('Failed to connect to MongoDB', err);
    }
  } else {
    console.error('MONGODB_URI not set! Running without DB connection.');
  }

  // Authentication Middleware
  const authenticateToken = (req: any, res: any, next: any) => {
    const token = req.cookies.token;
    if (!token) return res.status(401).json({ error: 'Unauthorized: No token provided' });

    jwt.verify(token, JWT_SECRET, (err: any, user: any) => {
      if (err) return res.status(403).json({ error: 'Forbidden: Invalid token' });
      req.user = user;
      next();
    });
  };

  // Authentication Routes
  app.post('/api/auth/register', async (req, res) => {
    try {
      const { name, email, password } = req.body;
      if (!name || !email || !password) {
        return res.status(400).json({ error: 'Please fill in all fields' });
      }
      const lowerEmail = email.toLowerCase();
      
      const existing = await UserModel.findOne({ email: new RegExp(`^${lowerEmail}$`, 'i') });
      if (existing) {
        return res.status(400).json({ error: 'Email already registered' });
      }

      const passwordHash = await bcrypt.hash(password, 10);
      const role = (lowerEmail === 'ahmmedshifat64649@gmail.com' || lowerEmail === 'admin@example.com') ? 'admin' : 'user';
      
      const newUser = new UserModel({
        id: 'user_' + Date.now().toString(),
        name,
        email,
        role,
        avatarUrl: `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(name)}`,
        passwordHash
      });

      await newUser.save();

      const token = jwt.sign({ id: newUser.id, name: newUser.name, email: newUser.email, role: newUser.role }, JWT_SECRET, { expiresIn: '7d' });
      res.cookie('token', token, { httpOnly: true, secure: process.env.NODE_ENV === 'production' });

      res.json({ id: newUser.id, name: newUser.name, email: newUser.email, role: newUser.role, avatarUrl: newUser.avatarUrl });
    } catch (err) {
      res.status(500).json({ error: 'Server error' });
    }
  });

  app.post('/api/auth/login', async (req, res) => {
    try {
      const { email, password } = req.body;
      if (!email || !password) {
        return res.status(400).json({ error: 'Please enter your email and password' });
      }
      const lowerEmail = email.toLowerCase();
      
      const foundUser = await UserModel.findOne({ email: new RegExp(`^${lowerEmail}$`, 'i') });
      if (!foundUser) {
        return res.status(400).json({ error: 'Invalid email or password' });
      }

      const match = await bcrypt.compare(password, foundUser.passwordHash || '');
      if (!match) {
        return res.status(400).json({ error: 'Invalid email or password' });
      }

      const token = jwt.sign({ id: foundUser.id, name: foundUser.name, email: foundUser.email, role: foundUser.role }, JWT_SECRET, { expiresIn: '7d' });
      res.cookie('token', token, { httpOnly: true, secure: process.env.NODE_ENV === 'production' });

      res.json({ id: foundUser.id, name: foundUser.name, email: foundUser.email, role: foundUser.role, avatarUrl: foundUser.avatarUrl });
    } catch (err) {
      res.status(500).json({ error: 'Server error' });
    }
  });

  // Google OAuth URL endpoint
  app.get('/api/auth/google/url', (req, res) => {
    const clientId = process.env.GOOGLE_CLIENT_ID;
    const redirectUri = `${process.env.APP_URL || 'http://localhost:3000'}/api/auth/google/callback`;

    if (!clientId) {
      return res.status(500).json({ error: 'Google Client ID is not configured. Please contact the administrator.' });
    }

    const params = new URLSearchParams({
      client_id: clientId,
      redirect_uri: redirectUri,
      response_type: 'code',
      scope: 'https://www.googleapis.com/auth/userinfo.profile https://www.googleapis.com/auth/userinfo.email',
      access_type: 'offline',
      prompt: 'select_account'
    });

    const url = `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
    res.json({ url });
  });

  // Google OAuth callback endpoint
  app.get(['/api/auth/google/callback', '/api/auth/google/callback/'], async (req, res) => {
    const { code } = req.query;
    const targetOrigin = process.env.APP_URL || 'http://localhost:3000';
    
    if (!code) {
      return res.send(`
        <html>
          <body>
            <script>
              if (window.opener) {
                window.opener.postMessage({ type: 'OAUTH_AUTH_FAILURE', error: 'No authorization code received from Google.' }, '${targetOrigin}');
                window.close();
              }
            </script>
            <p>Authentication failed. No authorization code received from Google.</p>
          </body>
        </html>
      `);
    }

    const clientId = process.env.GOOGLE_CLIENT_ID;
    const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
    const redirectUri = `${process.env.APP_URL || 'http://localhost:3000'}/api/auth/google/callback`;

    if (!clientId || !clientSecret) {
      return res.status(500).send('Google Client ID or Client Secret is not configured in environment variables.');
    }

    try {
      const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          code: code as string,
          client_id: clientId,
          client_secret: clientSecret,
          redirect_uri: redirectUri,
          grant_type: 'authorization_code'
        })
      });

      if (!tokenResponse.ok) {
        const errorText = await tokenResponse.text();
        throw new Error(`Failed to exchange token: ${errorText}`);
      }

      const tokens = (await tokenResponse.json()) as { access_token: string };

      const userInfoResponse = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
        headers: {
          Authorization: `Bearer ${tokens.access_token}`
        }
      });

      if (!userInfoResponse.ok) {
        const errorText = await userInfoResponse.text();
        throw new Error(`Failed to retrieve user info: ${errorText}`);
      }

      const googleUser = (await userInfoResponse.json()) as {
        sub: string;
        name: string;
        email: string;
        picture?: string;
      };

      if (!googleUser.email) {
        throw new Error('Google OAuth succeeded but returned no email address.');
      }

      const lowerEmail = googleUser.email.toLowerCase();
      let siteUser = await UserModel.findOne({ email: new RegExp(`^${lowerEmail}$`, 'i') });

      if (!siteUser) {
        siteUser = new UserModel({
          id: 'google_' + googleUser.sub,
          name: googleUser.name,
          email: googleUser.email,
          role: (lowerEmail === 'ahmmedshifat64649@gmail.com' || lowerEmail === 'admin@example.com') ? 'admin' : 'user',
          avatarUrl: googleUser.picture || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(googleUser.name)}`
        });
        await siteUser.save();
      } else if (lowerEmail === 'ahmmedshifat64649@gmail.com' || lowerEmail === 'admin@example.com') {
        if (siteUser.role !== 'admin') {
          siteUser.role = 'admin';
          await siteUser.save();
        }
      }

      // Issue JWT for Google Login
      const token = jwt.sign({ id: siteUser.id, name: siteUser.name, email: siteUser.email, role: siteUser.role }, JWT_SECRET, { expiresIn: '7d' });
      res.cookie('token', token, { httpOnly: true, secure: process.env.NODE_ENV === 'production' });

      res.send(`
        <html>
          <body>
            <script>
              if (window.opener) {
                window.opener.postMessage({ 
                  type: 'OAUTH_AUTH_SUCCESS', 
                  user: { id: '${siteUser.id}', name: '${siteUser.name}', email: '${siteUser.email}', role: '${siteUser.role}', avatarUrl: '${siteUser.avatarUrl}' } 
                }, '${targetOrigin}');
                window.close();
              } else {
                window.location.href = '/';
              }
            </script>
            <p>Google authentication successful. This window should close automatically.</p>
          </body>
        </html>
      `);
    } catch (err: any) {
      console.error('Google OAuth callback error:', err);
      res.send(`
        <html>
          <body>
            <script>
              if (window.opener) {
                window.opener.postMessage({ type: 'OAUTH_AUTH_FAILURE', error: ${JSON.stringify(err.message)} }, '${targetOrigin}');
                window.close();
              }
            </script>
            <p>Authentication failed: ${err.message}</p>
          </body>
        </html>
      `);
    }
  });

  // Items API
  app.get('/api/items', async (req, res) => {
    try {
      const { search, category, type, status, userId } = req.query;
      let query: any = {};

      if (userId) query.userId = userId;

      if (status) {
        query.status = status;
      } else if (!userId) {
        query.status = 'approved';
      }

      if (type && type !== 'all') query.type = type;

      if (category && category !== 'All Categories') {
        query.category = new RegExp(`^${category}$`, 'i');
      }

      if (search) {
        const q = new RegExp(search as string, 'i');
        query.$or = [{ title: q }, { description: q }, { location: q }];
      }

      const filtered = await ItemModel.find(query).sort({ datePosted: -1 });
      res.json(filtered);
    } catch (err) {
      res.status(500).json({ error: 'Server error' });
    }
  });

  app.get('/api/items/stats', async (req, res) => {
    try {
      const total = await ItemModel.countDocuments();
      const pending = await ItemModel.countDocuments({ status: 'pending' });
      const approved = await ItemModel.countDocuments({ status: 'approved' });
      const rejected = await ItemModel.countDocuments({ status: 'rejected' });
      res.json({ total, pending, approved, rejected });
    } catch (err) {
      res.status(500).json({ error: 'Server error' });
    }
  });

  app.get('/api/items/:id', async (req, res) => {
    try {
      const item = await ItemModel.findOne({ id: req.params.id });
      if (!item) {
        return res.status(404).json({ error: 'Item not found' });
      }
      res.json(item);
    } catch (err) {
      res.status(500).json({ error: 'Server error' });
    }
  });

  app.post('/api/items', authenticateToken, async (req: any, res: any) => {
    try {
      const { title, description, category, location, type, imageUrl } = req.body;
      if (!title || !description || !category || !location || !type) {
        return res.status(400).json({ error: 'Missing mandatory fields' });
      }

      const newItem = new ItemModel({
        id: 'item_' + Date.now().toString(),
        title,
        description,
        category,
        location,
        type,
        imageUrl: imageUrl || 'https://images.unsplash.com/photo-1595246140625-573b715d11dc?auto=format&fit=crop&q=80&w=400',
        status: 'pending',
        datePosted: new Date().toISOString(),
        userId: req.user.id,
        userName: req.user.name,
        userEmail: req.user.email
      });

      await newItem.save();
      res.json(newItem);
    } catch (err) {
      res.status(500).json({ error: 'Server error' });
    }
  });

  app.patch('/api/items/:id/status', authenticateToken, async (req: any, res: any) => {
    try {
      if (req.user.role !== 'admin') {
        return res.status(403).json({ error: 'Requires admin role' });
      }

      const { status } = req.body;
      if (!status || !['approved', 'rejected', 'pending'].includes(status)) {
        return res.status(400).json({ error: 'Invalid status value' });
      }

      const item = await ItemModel.findOneAndUpdate({ id: req.params.id }, { status }, { new: true });
      if (!item) {
        return res.status(404).json({ error: 'Item not found' });
      }
      res.json(item);
    } catch (err) {
      res.status(500).json({ error: 'Server error' });
    }
  });

  app.delete('/api/items/:id', authenticateToken, async (req: any, res: any) => {
    try {
      const item = await ItemModel.findOne({ id: req.params.id });
      if (!item) {
        return res.status(404).json({ error: 'Item not found' });
      }

      if (item.userId !== req.user.id && req.user.role !== 'admin') {
        return res.status(403).json({ error: 'Unauthorized to delete this item' });
      }

      const itemId = req.params.id;
      
      // Cascade delete chats and messages
      const chatsToDelete = await ChatModel.find({ itemId });
      const chatIdsToDelete = chatsToDelete.map(c => c.id);
      
      if (chatIdsToDelete.length > 0) {
        await MessageModel.deleteMany({ chatId: { $in: chatIdsToDelete } });
        await ChatModel.deleteMany({ itemId });
      }

      await ItemModel.deleteOne({ id: itemId });
      res.json({ success: true });
    } catch (err) {
      res.status(500).json({ error: 'Server error' });
    }
  });

  // Chats & Messaging API
  app.get('/api/chats', authenticateToken, async (req: any, res: any) => {
    try {
      const userId = req.user.id;
      const userChats = await ChatModel.find({ userIds: userId });
      
      userChats.sort((a, b) => {
        const aTime = a.lastMessageTime ? new Date(a.lastMessageTime).getTime() : 0;
        const bTime = b.lastMessageTime ? new Date(b.lastMessageTime).getTime() : 0;
        return bTime - aTime;
      });

      res.json(userChats);
    } catch (err) {
      res.status(500).json({ error: 'Server error' });
    }
  });

  app.post('/api/chats', authenticateToken, async (req: any, res: any) => {
    try {
      const { itemId, buyerId, buyerName, sellerId, sellerName } = req.body;
      if (!itemId || !buyerId || !sellerId) {
        return res.status(400).json({ error: 'Missing parameters for initiating chat' });
      }

      if (req.user.id !== buyerId && req.user.id !== sellerId) {
        return res.status(403).json({ error: 'You must be a participant in this chat to initiate it' });
      }

      const existing = await ChatModel.findOne({ itemId, userIds: { $all: [buyerId, sellerId] } });
      if (existing) {
        return res.json(existing);
      }

      const item = await ItemModel.findOne({ id: itemId });

      const newChat = new ChatModel({
        id: 'chat_' + Date.now().toString(),
        itemId,
        itemTitle: item ? item.title : 'Lost Item',
        itemType: item ? item.type : 'lost',
        itemImageUrl: item ? item.imageUrl : '',
        userIds: [buyerId, sellerId],
        participants: [
          { id: buyerId, name: buyerName || 'Finder/Owner', email: '' },
          { id: sellerId, name: sellerName || 'Poster', email: '' }
        ],
        lastMessage: 'Conversation started',
        lastMessageTime: new Date().toISOString()
      });

      await newChat.save();
      res.json(newChat);
    } catch (err) {
      res.status(500).json({ error: 'Server error' });
    }
  });

  app.get('/api/chats/:chatId/messages', authenticateToken, async (req: any, res: any) => {
    try {
      const chat = await ChatModel.findOne({ id: req.params.chatId });
      if (!chat || !chat.userIds.includes(req.user.id)) {
        return res.status(403).json({ error: 'Forbidden' });
      }

      const chatMsgs = await MessageModel.find({ chatId: req.params.chatId }).sort({ timestamp: 1 });
      res.json(chatMsgs);
    } catch (err) {
      res.status(500).json({ error: 'Server error' });
    }
  });

  app.post('/api/chats/:chatId/messages', authenticateToken, async (req: any, res: any) => {
    try {
      const { content } = req.body;
      if (!content) {
        return res.status(400).json({ error: 'Missing message content' });
      }

      const chat = await ChatModel.findOne({ id: req.params.chatId });
      if (!chat || !chat.userIds.includes(req.user.id)) {
        return res.status(403).json({ error: 'Forbidden' });
      }

      const newMessage = new MessageModel({
        id: 'msg_' + Date.now().toString(),
        chatId: req.params.chatId,
        senderId: req.user.id,
        senderName: req.user.name,
        content,
        timestamp: new Date().toISOString()
      });

      await newMessage.save();

      chat.lastMessage = content;
      chat.lastMessageTime = newMessage.timestamp;
      await chat.save();

      res.json(newMessage);
    } catch (err) {
      res.status(500).json({ error: 'Server error' });
    }
  });

  // Get User profile stats
  app.get('/api/users/:userId/stats', async (req, res) => {
    try {
      const userId = req.params.userId;
      const userItems = await ItemModel.find({ userId });
      const stats = {
        totalPosts: userItems.length,
        lostItems: userItems.filter(i => i.type === 'lost').length,
        foundItems: userItems.filter(i => i.type === 'found').length
      };
      res.json(stats);
    } catch (err) {
      res.status(500).json({ error: 'Server error' });
    }
  });

  // Clear chat logs functionality
  app.delete('/api/chats/:chatId/messages', authenticateToken, async (req: any, res: any) => {
    try {
      const chatId = req.params.chatId;
      const chat = await ChatModel.findOne({ id: chatId });
      if (!chat || !chat.userIds.includes(req.user.id)) {
        return res.status(403).json({ error: 'Forbidden' });
      }

      const deleted = await MessageModel.deleteMany({ chatId });
      
      chat.lastMessage = 'Chat history cleared';
      chat.lastMessageTime = new Date().toISOString();
      await chat.save();

      res.json({ success: true, count: deleted.deletedCount });
    } catch (err) {
      res.status(500).json({ error: 'Server error' });
    }
  });

  // Vite Integration middleware setup
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  // Global Error Handler Middleware
  app.use((err: any, req: any, res: any, next: any) => {
    console.error('Unhandled Express Error:', err);
    res.status(500).json({ error: 'Internal Server Error' });
  });

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Lost & Found Server running on http://0.0.0.0:${PORT}`);
  });
}

process.on('uncaughtException', (err) => {
  console.error('Uncaught Exception:', err);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

startServer().catch(err => {
  console.error('Failed to start server:', err);
});
