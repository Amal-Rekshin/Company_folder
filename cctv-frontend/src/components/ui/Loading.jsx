import React from 'react';

export const Loading = ({ message = 'Loading...' }) => {
  return (
    <div className="flex flex-col items-center justify-center min-h-[300px] w-full p-8 transition-opacity duration-300">
      <div className="relative flex items-center justify-center">
        {/* Outer glowing ring */}
        <div className="absolute w-16 h-16 rounded-full border-4 border-transparent border-t-primary-500 border-b-primary-200 animate-spin opacity-80"></div>
        {/* Inner reverse spinning ring */}
        <div className="absolute w-11 h-11 rounded-full border-4 border-transparent border-r-primary-400 border-l-primary-100 animate-spin-reverse opacity-60"></div>
        {/* Pulsing core */}
        <div className="w-6 h-6 rounded-lg bg-gradient-to-br from-primary-400 to-primary-600 shadow-lg shadow-primary-500/30 animate-pulse"></div>
      </div>
      
      <h3 className="mt-6 text-sm font-semibold text-slate-600 tracking-wide animate-pulse">
        {message}
      </h3>
    </div>
  );
};

export const LoadingPage = ({ message = 'Loading...' }) => {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] w-full p-8 transition-opacity duration-300">
      <div className="max-w-md w-full bg-white/70 backdrop-blur-md border border-white/20 shadow-[0_8px_30px_rgb(0,0,0,0.04)] rounded-3xl p-10 flex flex-col items-center">
        <div className="relative flex items-center justify-center">
          {/* Outer glowing ring */}
          <div className="absolute w-20 h-20 rounded-full border-4 border-transparent border-t-primary-500 border-b-primary-200 animate-spin opacity-80"></div>
          {/* Inner reverse spinning ring */}
          <div className="absolute w-14 h-14 rounded-full border-4 border-transparent border-r-primary-400 border-l-primary-100 animate-spin-reverse opacity-60"></div>
          {/* Pulsing core */}
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary-400 to-primary-600 shadow-lg shadow-primary-500/30 animate-pulse"></div>
        </div>

        <h2 className="text-xl font-bold text-slate-800 tracking-tight flex items-center gap-2 mt-8">
          <div className="w-5 h-5 rounded bg-gradient-to-br from-primary-400 to-primary-600"></div>
          CCTV<span className="text-primary-400 font-light">Pro</span>
        </h2>
        
        <h3 className="mt-6 text-base font-semibold text-slate-600 tracking-wide animate-pulse text-center">
          {message}
        </h3>
        <p className="mt-2 text-xs text-slate-400 text-center font-light">
          Securing your connection, please wait...
        </p>
      </div>
    </div>
  );
};
