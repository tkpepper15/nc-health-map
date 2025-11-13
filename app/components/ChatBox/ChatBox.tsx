'use client';

import { useState } from 'react';
import { useHealthcareStore } from '../../utils/store';

export default function ChatBox() {
  const [message, setMessage] = useState('');
  const { selectedCounty } = useHealthcareStore();
  const [chatHistory, setChatHistory] = useState<Array<{ role: 'user' | 'assistant', content: string }>>([]);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim() || !selectedCounty) return;

    // Add user message to chat
    const userMessage = { role: 'user' as const, content: message };
    setChatHistory(prev => [...prev, userMessage]);
    setMessage('');
    setIsLoading(true);

    try {
      // TODO: Replace with actual API call to HuggingFace or similar
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message,
          county: selectedCounty,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to get response');
      }

      const data = await response.json();
      setChatHistory(prev => [...prev, { role: 'assistant', content: data.response }]);
    } catch (error) {
      console.error('Chat error:', error);
      setChatHistory(prev => [
        ...prev,
        { role: 'assistant', content: 'Sorry, I encountered an error. Please try again.' }
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-gray-50 rounded-lg p-4">
      <h3 className="text-sm font-medium text-gray-700 mb-3">
        Ask about healthcare in this county
      </h3>

      {/* Chat History */}
      <div className="h-48 overflow-y-auto mb-4 space-y-3">
        {chatHistory.map((chat, index) => (
          <div
            key={index}
            className={`p-2 rounded-lg ${
              chat.role === 'user'
                ? 'bg-blue-100 ml-4'
                : 'bg-white mr-4 border border-gray-200'
            }`}
          >
            <p className="text-sm">{chat.content}</p>
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

      {/* Chat Input */}
      <form onSubmit={handleSubmit} className="flex space-x-2">
        <input
          type="text"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Type your question..."
          className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
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