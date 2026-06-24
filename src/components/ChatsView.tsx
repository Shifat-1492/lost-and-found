/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { Chat, Message, User } from '../types';
import { Send, MessageSquare, ShieldAlert, Trash2, Calendar, AlertCircle } from 'lucide-react';

interface ChatsViewProps {
  currentUser: User;
  initialSelectedChatId?: string | null;
}

export default function ChatsView({ currentUser, initialSelectedChatId }: ChatsViewProps) {
  const [chats, setChats] = useState<Chat[]>([]);
  const [selectedChat, setSelectedChat] = useState<Chat | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loadingChats, setLoadingChats] = useState(true);
  const [loadingMsgs, setLoadingMsgs] = useState(false);
  const [errorHeader, setErrorHeader] = useState('');
  const [showConfirmClear, setShowConfirmClear] = useState(false);
  
  const bottomRef = useRef<HTMLDivElement>(null);
  const pollIntervalRef = useRef<any>(null);

  // Fetch chats for current user
  const fetchChats = async () => {
    try {
      const response = await fetch(`/api/chats?userId=${currentUser.id}`);
      if (!response.ok) {
        throw new Error('Failed to load chats');
      }
      const data = await response.json();
      setChats(data);

      // Handle initial select or maintain selected chat state
      if (initialSelectedChatId) {
        const found = data.find((c: Chat) => c.id === initialSelectedChatId);
        if (found) {
          setSelectedChat(found);
        }
      } else if (!selectedChat && data.length > 0) {
        // select first chat by default if none selected
        setSelectedChat(data[0]);
      }
    } catch (e) {
      console.error('Error fetching chats:', e);
    } finally {
      setLoadingChats(false);
    }
  };

  // Fetch messages for active chat
  const fetchMessages = async (chatId: string, quiet = false) => {
    if (!quiet) setLoadingMsgs(true);
    try {
      const response = await fetch(`/api/chats/${chatId}/messages`);
      if (!response.ok) {
        throw new Error('Could not load messages');
      }
      const data = await response.json();
      setMessages(data);
    } catch (e) {
      console.error('Error fetching messages:', e);
    } finally {
      if (!quiet) setLoadingMsgs(false);
    }
  };

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedChat || !newMessage.trim()) return;

    const payload = {
      senderId: currentUser.id,
      senderName: currentUser.name,
      content: newMessage.trim()
    };

    const tempNewMsg = newMessage;
    setNewMessage('');
    setErrorHeader('');

    try {
      const response = await fetch(`/api/chats/${selectedChat.id}/messages`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        throw new Error('Failed to deliver message');
      }

      // immediately fetch new messages
      fetchMessages(selectedChat.id, true);
      // reload chat list sidebar to update preview
      fetchChats();
    } catch (err: any) {
      setErrorHeader('Failed to deliver message. Please retry.');
      setNewMessage(tempNewMsg);
    }
  };

  // Clear chat history
  const handleClearHistory = async () => {
    if (!selectedChat) return;
    try {
      const response = await fetch(`/api/chats/${selectedChat.id}/messages`, {
        method: 'DELETE'
      });
      if (!response.ok) {
        throw new Error();
      }
      setMessages([]);
      fetchChats();
    } catch {
      setErrorHeader('Could not clear history.');
    } finally {
      setShowConfirmClear(false);
    }
  };

  // Load chat lists on load
  useEffect(() => {
    fetchChats();
  }, [currentUser.id, initialSelectedChatId]);

  // Handle active conversation changes & polling trigger
  useEffect(() => {
    if (pollIntervalRef.current) {
      clearInterval(pollIntervalRef.current);
    }

    if (selectedChat) {
      fetchMessages(selectedChat.id);

      // Start dynamic poll refreshing every 3 seconds for visual interaction replication!
      pollIntervalRef.current = setInterval(() => {
        fetchMessages(selectedChat.id, true);
      }, 3000);
    }

    return () => {
      if (pollIntervalRef.current) {
        clearInterval(pollIntervalRef.current);
      }
    };
  }, [selectedChat]);

  // Scroll to bottom on message updates
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const selectChatWithDetails = (chat: Chat) => {
    setSelectedChat(chat);
  };

  const getPartnerName = (chat: Chat) => {
    const partner = chat.participants.find(p => p.id !== currentUser.id);
    return partner ? partner.name : 'Reporter';
  };

  return (
    <div className="bg-slate-800 border border-slate-700 rounded-3xl overflow-hidden shadow-2xl h-[calc(100vh-12rem)] flex font-sans">
      
      {/* List Directories Side Bar */}
      <div className="w-full sm:w-80 border-r border-slate-700 flex flex-col h-full bg-slate-900/40">
        <div className="p-4 border-b border-slate-700">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-300">Conversations</h2>
        </div>

        <div className="flex-1 overflow-y-auto divide-y divide-slate-700/50">
          {loadingChats ? (
            <div className="p-4 text-center text-slate-400">
              <div className="h-5 w-5 border-2 border-slate-600 border-t-indigo-500 rounded-full animate-spin mx-auto mb-2"></div>
              <span className="text-xs">Loading active channels...</span>
            </div>
          ) : chats.length === 0 ? (
            <div className="p-8 text-center text-slate-400 space-y-2 mt-10">
              <MessageSquare className="h-8 w-8 mx-auto text-slate-500" />
              <p className="text-xs font-semibold text-slate-350">No chat folders</p>
              <p className="text-[10px] text-slate-400">Start chat with details page messaging button!</p>
            </div>
          ) : (
            chats.map((chat) => {
              const active = selectedChat?.id === chat.id;
              const title = getPartnerName(chat);
              
              return (
                <button
                  key={chat.id}
                  onClick={() => selectChatWithDetails(chat)}
                  className={`w-full p-4 text-left flex items-start space-x-3 transition-colors select-none ${
                    active ? 'bg-indigo-600/10 border-l-4 border-indigo-500' : 'hover:bg-slate-800/40'
                  }`}
                >
                  <img
                    src={chat.itemImageUrl || 'https://api.dicebear.com/7.x/initials/svg?seed=wallet'}
                    alt="item preview"
                    className="h-10 w-10 rounded-lg object-cover bg-slate-800 shrink-0 border border-slate-700"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1595246140625-573b715d11dc?auto=format&fit=crop&q=80&w=400';
                    }}
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <p className="text-xs font-semibold text-white truncate">{title}</p>
                      <span className="text-[9px] text-slate-400">
                        {chat.lastMessageTime ? new Date(chat.lastMessageTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
                      </span>
                    </div>
                    <p className="text-[11px] font-bold text-slate-400 truncate mt-0.5">{chat.itemTitle}</p>
                    <p className="text-[10px] text-slate-400 truncate mt-1">
                      {chat.lastMessage || 'Start writing messages'}
                    </p>
                  </div>
                </button>
              );
            })
          )}
        </div>
      </div>

      {/* active logs detailed chat interface */}
      <div className="flex-1 flex flex-col h-full bg-slate-800">
        {selectedChat ? (
          <>
            {/* active client info banner */}
            <div className="p-4 border-b border-slate-700 bg-slate-900/20 flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <img
                  src={selectedChat.itemImageUrl || 'https://api.dicebear.com/7.x/initials/svg?seed=cellphone'}
                  alt="item preview"
                  className="h-9 w-9 rounded-md object-cover bg-slate-900 border border-slate-700"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1595246140625-573b715d11dc?auto=format&fit=crop&q=80&w=400';
                  }}
                />
                <div>
                  <h4 className="text-xs text-slate-400 font-bold uppercase tracking-wider block">
                    Chat with {getPartnerName(selectedChat)}
                  </h4>
                  <div className="flex items-center space-x-1.5 mt-0.5">
                    <span className="text-xs font-bold text-white truncate">{selectedChat.itemTitle}</span>
                    <span className={`px-1.5 py-0.5 rounded-sm text-[9px] uppercase font-bold text-white ${
                      selectedChat.itemType === 'lost' ? 'bg-red-500/20 text-red-300' : 'bg-emerald-500/20 text-emerald-300'
                    }`}>
                      {selectedChat.itemType}
                    </span>
                  </div>
                </div>
              </div>

              {/* clears logs capability */}
              {showConfirmClear ? (
                <div className="flex items-center space-x-1.5 bg-red-955 bg-red-950/40 border border-red-500/20 px-2 py-1 rounded-xl animate-in fade-in slide-in-from-right-2 duration-150">
                  <span className="text-[10px] text-red-300 font-bold uppercase">Clear chat?</span>
                  <button
                    type="button"
                    onClick={handleClearHistory}
                    className="px-2 py-1 bg-red-650 bg-red-600 hover:bg-red-700 text-white rounded-lg text-[10px] font-bold cursor-pointer"
                  >
                    Yes
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowConfirmClear(false)}
                    className="px-2 py-1 bg-slate-700 hover:bg-slate-650 text-slate-200 rounded-lg text-[10px] font-bold cursor-pointer"
                  >
                    No
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => setShowConfirmClear(true)}
                  title="Clear current messages history"
                  className="p-2 text-slate-400 hover:text-red-400 rounded-lg hover:bg-slate-700 transition-colors cursor-pointer"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              )}
            </div>

            {/* Error indicators */}
            {errorHeader && (
              <div className="px-4 py-2 bg-red-500/10 border-b border-red-500/25 text-red-300 text-xs flex items-center space-x-1.5">
                <AlertCircle className="h-4 w-4" />
                <span>{errorHeader}</span>
              </div>
            )}

            {/* Message logs list view */}
            <div className="flex-1 p-4 overflow-y-auto space-y-4">
              {loadingMsgs ? (
                <div className="flex items-center justify-center h-full">
                  <div className="h-6 w-6 border-2 border-slate-700 border-t-indigo-500 rounded-full animate-spin"></div>
                </div>
              ) : messages.length === 0 ? (
                <div className="text-center py-12 text-slate-400 space-y-2">
                  <div className="p-3 bg-slate-900/30 rounded-full w-max mx-auto border border-slate-700">
                    <MessageSquare className="h-6 w-6 text-slate-500" />
                  </div>
                  <p className="text-xs font-semibold text-slate-350">Conversation started</p>
                  <p className="text-[10px] text-slate-400">Be respectfull and coordinate offline locations carefully!</p>
                </div>
              ) : (
                messages.map((msg) => {
                  const mine = msg.senderId === currentUser.id;
                  
                  return (
                    <div
                      key={msg.id}
                      className={`flex flex-col max-w-[80%] ${
                        mine ? 'ml-auto items-end' : 'mr-auto items-start'
                      }`}
                    >
                      <span className="text-[10px] text-slate-400 font-medium mb-1 px-1">
                        {mine ? 'You' : msg.senderName}
                      </span>
                      <div
                        className={`p-3 rounded-2xl text-sm whitespace-pre-wrap leading-relaxed shadow-sm ${
                          mine
                            ? 'bg-gradient-to-tr from-indigo-500 to-violet-600 text-white rounded-tr-none'
                            : 'bg-slate-900 border border-slate-700 text-slate-200 rounded-tl-none'
                        }`}
                      >
                        {msg.content}
                      </div>
                      <span className="text-[9px] text-slate-400 mt-1 px-1">
                        {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                  );
                })
              )}
              <div ref={bottomRef} />
            </div>

            {/* Chat footer send interface */}
            <form onSubmit={sendMessage} className="p-4 bg-slate-900/60 border-t border-slate-700 flex space-x-2">
              <input
                type="text"
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                placeholder="Type your message..."
                className="flex-1 bg-slate-900 border border-slate-700 hover:border-slate-600 rounded-xl px-4 py-2 text-white placeholder-slate-400 text-sm focus:outline-hidden focus:ring-1 focus:ring-indigo-500"
              />
              <button
                type="submit"
                className="h-10 w-10 rounded-xl bg-indigo-600/90 hover:bg-indigo-500 flex items-center justify-center text-white transition-colors cursor-pointer shrink-0 shadow-md shadow-indigo-500/15"
              >
                <Send className="h-4.5 w-4.5" />
              </button>
            </form>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center p-8 text-center text-slate-400 min-h-60 sm:min-h-0">
            <div className="p-4 bg-slate-900/30 border border-slate-700 rounded-full mb-3">
              <MessageSquare className="h-8 w-8 text-slate-400" />
            </div>
            <h3 className="text-sm font-bold text-white">Select a Chat Folder</h3>
            <p className="text-[11px] text-slate-400 mt-1 max-w-xs leading-relaxed">
              Open feed card item reports, click "Message owner" to coordinate findings direct in private channels!
            </p>
          </div>
        )}
      </div>

    </div>
  );
}
