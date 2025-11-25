'use client';

import { useState, useEffect } from 'react';

export default function TestSimple() {
  const [message, setMessage] = useState('Loading...');
  
  useEffect(() => {
    setMessage('Component loaded successfully!');
  }, []);
  
  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold">Simple Test Page</h1>
      <p>{message}</p>
      <p>If you can see this, the frontend is working!</p>
    </div>
  );
}