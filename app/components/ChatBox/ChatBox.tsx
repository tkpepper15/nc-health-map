'use client';

import { useState } from 'react';

export default function ChatBox({ countyName }: { countyName: string | null }) {
  const [message, setMessage] = useState('');
  const [chatHistory, setChatHistory] = useState<Array<{ role: 'user' | 'assistant', content: string }>>([]);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim()) return;

    // Add user message to chat
    const userMessage = { role: 'user' as const, content: message };
    setChatHistory(prev => [...prev, userMessage]);
    setMessage('');
    setIsLoading(true);

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message,
          county: countyName,
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Failed to get response');
      }

      setChatHistory(prev => [...prev, { role: 'assistant', content: data.response }]);
    } catch (error) {
      console.error('Chat error:', error);
      const msg = error instanceof Error ? error.message : 'Unknown error';
      setChatHistory(prev => [
        ...prev,
        { role: 'assistant', content: `Error: ${msg}` }
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-4 flex flex-col h-[380px]">
      <h3 className="text-sm font-semibold text-gray-900 mb-3">
        Ask about healthcare in this county
      </h3>

      {/* Chat History - grows and scrolls */}
      <div className="flex-1 min-h-0 overflow-y-auto mb-4 space-y-3">
        {chatHistory.map((chat, index) => (
          <div
            key={index}
            className={`p-3 rounded-lg text-sm text-gray-900 leading-relaxed whitespace-pre-wrap ${
              chat.role === 'user'
                ? 'bg-blue-600 text-white ml-6'
                : 'bg-gray-100 mr-6 border border-gray-200'
            }`}
          >
            {chat.content}
          </div>
        ))}
        {isLoading && (
          <div className="flex space-x-2 justify-center items-center p-2">
            <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '0s' }}></div>
            <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
            <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '0.4s' }}></div>
          </div>
        )}
      </div>

      {/* Chat Input - anchored to bottom via flex column layout */}
      <form onSubmit={handleSubmit} className="flex space-x-2 mt-auto">
        <input
          type="text"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Type your question..."
          className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 placeholder-gray-400 bg-white"
          disabled={isLoading}
        />
        <button
          type="submit"
          disabled={isLoading || !message.trim()}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
        >
          Send
        </button>
      </form>
    </div>
  );
}