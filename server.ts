import express from 'express';
import path from 'path';
import fs from 'fs';
import { createServer as createViteServer } from 'vite';
import { Item, User, Chat, Message } from './src/types';
import { 
  initializeDatabase, 
  isUsingMongo, 
  getUsers, 
  saveUser, 
  getItems, 
  saveItem, 
  updateItemStatus, 
  deleteItem, 
  getChats, 
  saveChat, 
  getMessages, 
  saveMessage, 
  clearMessages 
} from './src/db/dbManager';

// Seed default users
const defaultUsers: User[] = [
  { id: 'shifat_admin', name: 'Ahmmed Shifat', email: 'ahmmedshifat64649@gmail.com', role: 'admin', avatarUrl: 'https://api.dicebear.com/7.x/initials/svg?seed=Ahmmed%20Shifat&backgroundColor=4f46e5' },
  { id: 'admin', name: 'Nafiz Ahmed Emon (Admin)', email: 'admin@example.com', role: 'admin', avatarUrl: 'https://api.dicebear.com/7.x/initials/svg?seed=Nafiz%20Ahmed%20Emon&backgroundColor=4f46e5' },
  { id: 'user1', name: 'Sarah Jenkins', email: 'sarah@example.com', role: 'user', avatarUrl: 'https://api.dicebear.com/7.x/initials/svg?seed=Sarah%20Jenkins&backgroundColor=0ea5e9' },
  { id: 'user2', name: 'Taj Tarafder', email: 'taj@example.com', role: 'user', avatarUrl: 'https://api.dicebear.com/7.x/initials/svg?seed=Taj%20Tarafder&backgroundColor=10b981' },
  { id: 'user3', name: 'Akash Ahmed', email: 'akash@example.com', role: 'user', avatarUrl: 'https://api.dicebear.com/7.x/initials/svg?seed=Akash%20Ahmed&backgroundColor=f59e0b' },
  { id: 'user4', name: 'Osama Hossain', email: 'osama@example.com', role: 'user', avatarUrl: 'https://api.dicebear.com/7.x/initials/svg?seed=Osama%20Hossain&backgroundColor=8b5cf6' }
];

// Seed default items
const defaultItems: Item[] = [
  {
    id: 'item1',
    title: 'Lost Black Wallet',
    description: 'Black leather wallet with cards, ID, and some cash. Highly sentimental value as it was a gift.',
    category: 'Wallet',
    location: 'Central Park near the Bethesda Fountain',
    type: 'lost',
    imageUrl: 'https://images.unsplash.com/photo-1627123424574-724758594e93?auto=format&fit=crop&q=80&w=600',
    status: 'approved',
    datePosted: '2026-04-08T14:30:00.000Z',
    userId: 'user1',
    userName: 'Sarah Jenkins',
    userEmail: 'sarah@example.com'
  },
  {
    id: 'item2',
    title: 'Found iPhone 13 Pro',
    description: 'Found near Times Square station entrance. It is a graphite black color iPhone with a clear hybrid spigen case. Currently turned on but locked.',
    category: 'Phone',
    location: 'Times Square Subway Station',
    type: 'found',
    imageUrl: 'https://images.unsplash.com/photo-1510557880182-3d4d3cba35a5?auto=format&fit=crop&q=80&w=600',
    status: 'approved',
    datePosted: '2026-04-20T09:15:00.000Z',
    userId: 'user2',
    userName: 'Taj Tarafder',
    userEmail: 'taj@example.com'
  },
  {
    id: 'item3',
    title: 'Lost Toyota Car Keys',
    description: 'Toyota car key fob with a red customized keychain saying \"Adventure\". Lost near the Downtown LA Starbucks coffee shop.',
    category: 'Keys',
    location: 'Downtown LA, near the 5th Ave Starbucks',
    type: 'lost',
    imageUrl: 'https://images.unsplash.com/photo-1582139329536-e7284fece509?auto=format&fit=crop&q=80&w=600',
    status: 'approved',
    datePosted: '2026-04-21T18:45:00.000Z',
    userId: 'user3',
    userName: 'Akash Ahmed',
    userEmail: 'akash@example.com'
  },
  {
    id: 'item4',
    title: 'Found Daffodil University ID Card',
    description: 'Found a Daffodil International University student ID card belonging to Shyman Tarafder. Found on Sobhanbag campus CSE lab building.',
    category: 'Card',
    location: 'DIU Campus, Sobhanbag, CSE building 3rd Floor',
    type: 'found',
    imageUrl: 'https://images.unsplash.com/photo-1593508512255-86ab42a8e620?auto=format&fit=crop&q=80&w=600',
    status: 'pending',
    datePosted: '2026-04-22T10:00:00.000Z',
    userId: 'user4',
    userName: 'Osama Hossain',
    userEmail: 'osama@example.com'
  }
];

// Seed default chats & messages
const defaultChats: Chat[] = [
  {
    id: 'chat1',
    itemId: 'item1',
    itemTitle: 'Lost Black Wallet',
    itemType: 'lost',
    itemImageUrl: 'https://images.unsplash.com/photo-1627123424574-724758594e93?auto=format&fit=crop&q=80&w=600',
    userIds: ['user2', 'user1'], // Buyer, Seller (Poster)
    participants: [
      { id: 'user2', name: 'Taj Tarafder', email: 'taj@example.com' },
      { id: 'user1', name: 'Sarah Jenkins', email: 'sarah@example.com' }
    ],
    lastMessage: 'I have the wallet safely stored. I will send you a picture to confirm.',
    lastMessageTime: '2026-06-23T10:29:00.000Z'
  },
  {
    id: 'chat2',
    itemId: 'item2',
    itemTitle: 'Found iPhone 13 Pro',
    itemType: 'found',
    itemImageUrl: 'https://images.unsplash.com/photo-1510557880182-3d4d3cba35a5?auto=format&fit=crop&q=80&w=600',
    userIds: ['user1', 'user2'],
    participants: [
      { id: 'user1', name: 'Sarah Jenkins', email: 'sarah@example.com' },
      { id: 'user2', name: 'Taj Tarafder', email: 'taj@example.com' }
    ],
    lastMessage: 'Sounds perfect! Let us arrange a secure meeting place.',
    lastMessageTime: '2026-06-23T10:19:51.000Z'
  }
];

const defaultMessages: Message[] = [
  {
    id: 'msg1',
    chatId: 'chat1',
    senderId: 'user2',
    senderName: 'Taj Tarafder',
    content: 'Hi Sarah, is this wallet still lost? I saw something very similar near Bethesda Fountain.',
    timestamp: '2026-06-23T10:25:00.000Z'
  },
  {
    id: 'msg2',
    chatId: 'chat1',
    senderId: 'user1',
    senderName: 'Sarah Jenkins',
    content: 'Oh my goodness, yes it is! What did it look like?',
    timestamp: '2026-06-23T10:27:00.000Z'
  },
  {
    id: 'msg3',
    chatId: 'chat1',
    senderId: 'user2',
    senderName: 'Taj Tarafder',
    content: 'I have the wallet safely stored. I will send you a picture to confirm.',
    timestamp: '2026-06-23T10:29:00.000Z'
  },
  {
    id: 'msg4',
    chatId: 'chat2',
    senderId: 'user1',
    senderName: 'Sarah Jenkins',
    content: 'Hey Taj, is that found iPhone still with you?',
    timestamp: '2026-06-23T10:15:00.000Z'
  },
  {
    id: 'msg5',
    chatId: 'chat2',
    senderId: 'user2',
    senderName: 'Taj Tarafder',
    content: 'Yes! It’s locked but I’m hoping to find the real owner.',
    timestamp: '2026-06-23T10:18:00.000Z'
  },
  {
    id: 'msg6',
    chatId: 'chat2',
    senderId: 'user1',
    senderName: 'Sarah Jenkins',
    content: 'Sounds perfect! Let us arrange a secure meeting place.',
    timestamp: '2026-06-23T10:19:51.000Z'
  }
];

async function startServer() {
  const app = express();
  app.use(express.json({ limit: '10mb' }));
  const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

  // Initialize Database (MongoDB Atlas or fallback JSON storage)
  await initializeDatabase(defaultUsers, defaultItems, defaultChats, defaultMessages);

  // Authentication Routes
  app.post('/api/auth/register', async (req, res) => {
    const { name, email, password } = req.body;
    if (!name || !email || !password) {
      return res.status(400).json({ error: 'Please fill in all fields' });
    }
    const lowerEmail = email.toLowerCase();
    const users = await getUsers(defaultUsers);
    const existing = users.find(u => u.email.toLowerCase() === lowerEmail);
    if (existing) {
      return res.status(400).json({ error: 'Email already registered' });
    }

    const newUser: User = {
      id: 'user_' + Date.now().toString(),
      name,
      emailLower: lowerEmail, // help standard comparison
      email: email,
      role: (lowerEmail === 'ahmmedshifat64649@gmail.com' || lowerEmail === 'ahmmed64649@gmail.com' || lowerEmail === 'admin@example.com') ? 'admin' : 'user',
      avatarUrl: `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(name)}&backgroundColor=4f46e5`
    } as any;

    await saveUser(newUser, defaultUsers);

    res.json(newUser);
  });

  app.post('/api/auth/login', async (req, res) => {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: 'Please enter your email and password' });
    }
    const lowerEmail = email.toLowerCase();
    
    // Quick match
    const users = await getUsers(defaultUsers);
    const foundUser = users.find(u => u.email.toLowerCase() === lowerEmail);
    if (!foundUser) {
      return res.status(400).json({ error: 'Invalid email or password' });
    }

    // Since it's a diagnostic/demonstration app, lets trust password for demo, or match 'password'
    if (password && password.length < 4) {
      return res.status(400).json({ error: 'Password must be at least 4 characters' });
    }

    res.json(foundUser);
  });

  // Google OAuth URL endpoint
  app.get('/api/auth/google/url', (req, res) => {
    const clientId = process.env.GOOGLE_CLIENT_ID;
    let appUrl = process.env.APP_URL || 'http://localhost:3000';
    if (appUrl.endsWith('/')) {
      appUrl = appUrl.slice(0, -1);
    }
    const redirectUri = `${appUrl}/api/auth/google/callback`;

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
    if (!code) {
      return res.send(`
        <html>
          <body>
            <script>
              if (window.opener) {
                window.opener.postMessage({ type: 'OAUTH_AUTH_FAILURE', error: 'No authorization code received from Google.' }, '*');
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
    let appUrl = process.env.APP_URL || 'http://localhost:3000';
    if (appUrl.endsWith('/')) {
      appUrl = appUrl.slice(0, -1);
    }
    const redirectUri = `${appUrl}/api/auth/google/callback`;

    if (!clientId || !clientSecret) {
      return res.status(500).send('Google Client ID or Client Secret is not configured in environment variables.');
    }

    try {
      // Exchange code for token
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

      // Fetch user info
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
      const users = await getUsers(defaultUsers);
      let siteUser = users.find(u => u.email.toLowerCase() === lowerEmail);

      if (!siteUser) {
        // Create user
        siteUser = {
          id: 'google_' + googleUser.sub,
          name: googleUser.name,
          email: googleUser.email,
          role: (lowerEmail === 'ahmmedshifat64649@gmail.com' || lowerEmail === 'ahmmed64649@gmail.com' || lowerEmail === 'admin@example.com') ? 'admin' : 'user',
          avatarUrl: googleUser.picture || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(googleUser.name)}&backgroundColor=4f46e5`
        };
        await saveUser(siteUser, defaultUsers);
      } else {
        // Always update siteUser properties to keep them in sync with their actual Google Account!
        let changed = false;
        
        if (googleUser.picture && siteUser.avatarUrl !== googleUser.picture) {
          siteUser.avatarUrl = googleUser.picture;
          changed = true;
        }
        if (googleUser.name && siteUser.name !== googleUser.name) {
          siteUser.name = googleUser.name;
          changed = true;
        }
        
        const shouldBeAdmin = (lowerEmail === 'ahmmedshifat64649@gmail.com' || lowerEmail === 'ahmmed64649@gmail.com' || lowerEmail === 'admin@example.com');
        if (shouldBeAdmin && siteUser.role !== 'admin') {
          siteUser.role = 'admin';
          changed = true;
        }

        if (changed) {
          await saveUser(siteUser, defaultUsers);
        }
      }

      res.send(`
        <html>
          <body>
            <script>
              if (window.opener) {
                window.opener.postMessage({ 
                  type: 'OAUTH_AUTH_SUCCESS', 
                  user: ${JSON.stringify(siteUser)} 
                }, '*');
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
                window.opener.postMessage({ type: 'OAUTH_AUTH_FAILURE', error: ${JSON.stringify(err.message)} }, '*');
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
    const { search, category, type, status, userId } = req.query;
    const items = await getItems(defaultItems);
    let filtered = [...items];

    if (userId) {
      filtered = filtered.filter(item => item.userId === userId);
    }

    if (status) {
      filtered = filtered.filter(item => item.status === status);
    } else {
      // By default, if not specifically requested by admin or owned, only show approved posts
      if (!userId) {
        filtered = filtered.filter(item => item.status === 'approved');
      }
    }

    if (type) {
      filtered = filtered.filter(item => item.type === type);
    }

    if (category && category !== 'All Categories') {
      filtered = filtered.filter(item => item.category.toLowerCase() === (category as string).toLowerCase());
    }

    if (search) {
      const q = (search as string).toLowerCase();
      filtered = filtered.filter(item => 
        item.title.toLowerCase().includes(q) || 
        item.description.toLowerCase().includes(q) || 
        item.location.toLowerCase().includes(q)
      );
    }

    // Sort by datePosted desc
    filtered.sort((a, b) => new Date(b.datePosted).getTime() - new Date(a.datePosted).getTime());

    res.json(filtered);
  });

  app.get('/api/items/stats', async (req, res) => {
    const items = await getItems(defaultItems);
    const stats = {
      total: items.length,
      pending: items.filter(i => i.status === 'pending').length,
      approved: items.filter(i => i.status === 'approved').length,
      rejected: items.filter(i => i.status === 'rejected').length
    };
    res.json(stats);
  });

  app.get('/api/items/:id', async (req, res) => {
    const items = await getItems(defaultItems);
    const item = items.find(i => i.id === req.params.id);
    if (!item) {
      return res.status(404).json({ error: 'Item not found' });
    }
    res.json(item);
  });

  app.post('/api/items', async (req, res) => {
    const { title, description, category, location, type, imageUrl, userId, userName, userEmail } = req.body;
    if (!title || !description || !category || !location || !type || !userId) {
      return res.status(400).json({ error: 'Missing mandatory fields' });
    }

    const newItem: Item = {
      id: 'item_' + Date.now().toString(),
      title,
      description,
      category,
      location,
      type: type as 'lost' | 'found',
      imageUrl: imageUrl || 'https://images.unsplash.com/photo-1595246140625-573b715d11dc?auto=format&fit=crop&q=80&w=400',
      status: 'pending', // require admin approval first!
      datePosted: new Date().toISOString(),
      userId,
      userName,
      userEmail: userEmail || 'user@example.com'
    };

    await saveItem(newItem, defaultItems);

    res.json(newItem);
  });

  app.patch('/api/items/:id/status', async (req, res) => {
    const { status } = req.body; // 'approved' | 'rejected' | 'pending'
    if (!status || !['approved', 'rejected', 'pending'].includes(status)) {
      return res.status(400).json({ error: 'Invalid status value' });
    }

    const updated = await updateItemStatus(req.params.id, status as any, defaultItems);
    if (!updated) {
      return res.status(404).json({ error: 'Item not found' });
    }

    res.json(updated);
  });

  app.delete('/api/items/:id', async (req, res) => {
    const success = await deleteItem(req.params.id, defaultItems);
    if (!success) {
      return res.status(404).json({ error: 'Item not found' });
    }
    res.json({ success: true });
  });

  // Chats & Messaging API
  app.get('/api/chats', async (req, res) => {
    const { userId } = req.query;
    if (!userId) {
      return res.status(400).json({ error: 'userId is required' });
    }
    const chats = await getChats(defaultChats);
    const userChats = chats.filter(chat => chat.userIds.includes(userId as string));
    
    // Sort active chats by lastMessageTime desc
    userChats.sort((a, b) => {
      const aTime = a.lastMessageTime ? new Date(a.lastMessageTime).getTime() : 0;
      const bTime = b.lastMessageTime ? new Date(b.lastMessageTime).getTime() : 0;
      return bTime - aTime;
    });

    res.json(userChats);
  });

  app.post('/api/chats', async (req, res) => {
    const { itemId, buyerId, buyerName, sellerId, sellerName } = req.body;
    if (!itemId || !buyerId || !sellerId) {
      return res.status(400).json({ error: 'Missing parameters for initiating chat' });
    }

    const chats = await getChats(defaultChats);
    // Check if chat already exists
    const existing = chats.find(chat => chat.itemId === itemId && chat.userIds.includes(buyerId) && chat.userIds.includes(sellerId));
    if (existing) {
      return res.json(existing);
    }

    // Fetch item details to attach image & title
    const items = await getItems(defaultItems);
    const item = items.find(i => i.id === itemId);

    const newChat: Chat = {
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
    };

    await saveChat(newChat, defaultChats);

    res.json(newChat);
  });

  app.get('/api/chats/:chatId/messages', async (req, res) => {
    const messages = await getMessages(defaultMessages);
    const chatMsgs = messages.filter(msg => msg.chatId === req.params.chatId);
    // Sort ASC
    chatMsgs.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
    res.json(chatMsgs);
  });

  app.post('/api/chats/:chatId/messages', async (req, res) => {
    const { senderId, senderName, content } = req.body;
    if (!senderId || !content) {
      return res.status(400).json({ error: 'Missing message body info' });
    }

    const newMessage: Message = {
      id: 'msg_' + Date.now().toString(),
      chatId: req.params.chatId,
      senderId,
      senderName,
      content,
      timestamp: new Date().toISOString()
    };

    await saveMessage(newMessage, defaultMessages);

    // Update parent Chat list metadata
    const chats = await getChats(defaultChats);
    const chatIndex = chats.findIndex(c => c.id === req.params.chatId);
    if (chatIndex !== -1) {
      chats[chatIndex].lastMessage = content;
      chats[chatIndex].lastMessageTime = newMessage.timestamp;
      await saveChat(chats[chatIndex], defaultChats);
    }

    res.json(newMessage);
  });

  // Get User profile stats
  app.get('/api/users/:userId/stats', async (req, res) => {
    const userId = req.params.userId;
    const items = await getItems(defaultItems);
    const userItems = items.filter(i => i.userId === userId);
    const stats = {
      totalPosts: userItems.length,
      lostItems: userItems.filter(i => i.type === 'lost').length,
      foundItems: userItems.filter(i => i.type === 'found').length
    };
    res.json(stats);
  });

  // Clear chat logs functionality
  app.delete('/api/chats/:chatId/messages', async (req, res) => {
    const chatId = req.params.chatId;
    const deletedCount = await clearMessages(chatId, defaultMessages, defaultChats);
    res.json({ success: true, count: deletedCount });
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

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Lost & Found Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
