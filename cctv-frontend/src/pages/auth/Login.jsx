import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';

const Login = () => {
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);
    
    const result = await login(email, password);
    if (!result.success) {
      setError(result.message);
    }
    
    setIsLoading(false);
  };


  const acc =[
    {
      name : 'Admin',
      username : "admin@cctv.com",
      password : 'password123'
    },
    {
      name : 'Customer',
      username : "customer@cctv.com",
      password : 'password123'
    },
    {
      name : 'Technician',
      username : "tech@cctv.com",
      password : 'password123'
    },
    {
      name : 'Vasanth',
      username : 'vasanh@gmail.com',
      password : 'vasanth'
    },
    {
      name : 'Partner',
      username : "partner@cctv.com",
      password : 'password123'
    }
  ]

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50">
      <div className="glass-card p-8 max-w-md w-full">
        <h2 className="text-2xl font-bold text-center mb-6 text-slate-800">CCTV Login</h2>
        
        {error && (
          <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-lg text-sm">
            {error}
          </div>
        )}

        <form className="space-y-4" onSubmit={handleSubmit}>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Email</label>
            <input 
              type="email" 
              className="input-field" 
              placeholder="john@example.com" 
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Password</label>
            <input 
              type="password" 
              className="input-field" 
              placeholder="••••••••" 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          <button 
            type="submit" 
            className="btn-primary w-full disabled:opacity-70 disabled:cursor-not-allowed"
            disabled={isLoading}
          >
            {isLoading ? 'Signing In...' : 'Sign In'}
          </button>
        </form>

        <div className="grid grid-cols-4 gap-2 mt-4">
          {acc.map((item, index) => (
            <button 
              key={index}
              type="button"
              onClick={() => {
                setEmail(item.username);
                setPassword(item.password);
              }}
              className="btn-secondary !py-1.5 !px-1 text-xs text-center font-semibold"
            >
              {item.name}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Login;
