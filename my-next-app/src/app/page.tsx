'use client';

import { useState, useEffect, useRef } from 'react';
import { Eye, EyeOff } from 'lucide-react';
import Script from 'next/script';

export default function CustomVideoPlayer() {
  const [showProgressBar, setShowProgressBar] = useState(true);
  const [videoId, setVideoId] = useState('dQw4w9WgXcQ'); // Default YouTube video ID
  const [inputVideoId, setInputVideoId] = useState('');
  const playerRef = useRef(null);
  const [player, setPlayer] = useState(null);
  const [playerReady, setPlayerReady] = useState(false);
  const [scriptsLoaded, setScriptsLoaded] = useState(false);

  // Get the current control configuration - keep all controls the same
  // regardless of progress bar state (we'll hide elements with CSS instead)
  const getControlsConfig = () => {
    return [
      'play-large',
      'play',
      'mute',
      'volume',
      'current-time',
      'progress', // Always include progress in config
      'captions',
      'settings',
      'pip',
      'airplay',
      'fullscreen'
    ];
  };
  
  // Initialize Plyr when component mounts
  useEffect(() => {
    if (!scriptsLoaded) return; // Wait until scripts are loaded
    
    if (typeof window !== 'undefined') {
      // Initialize player
      const initPlayer = () => {
        // Make sure Plyr is loaded
        if (!window.Plyr) {
          console.log('Plyr not loaded yet, waiting...');
          setTimeout(initPlayer, 100);
          return;
        }
        
        console.log('Initializing Plyr player');
        
        // Destroy previous player if it exists
        if (player) {
          player.destroy();
        }

        // Create new Plyr instance with all controls
        const newPlayer = new window.Plyr('#player', {
          controls: getControlsConfig(),
          youtube: { 
            noCookie: true,
            rel: 0,
            showinfo: 0,
            iv_load_policy: 3,
            modestbranding: 1
          }
        });
        
        setPlayer(newPlayer);
        
        // Add event listeners for the player
        newPlayer.on('ready', () => {
          console.log('Player ready event fired');
          setPlayerReady(true);
        });
      };
      
      // Initialize the player after a short delay
      initPlayer();
    }
  }, [videoId, scriptsLoaded]);

  // Add the eye button once player is ready - only once
  useEffect(() => {
    if (player && playerReady) {
      // Add the custom button on initial load
      const setupEyeButton = () => {
        addCustomButton();
        
        // Apply initial visibility state to progress bar and time
        updateProgressVisibility(showProgressBar);
      };
      
      // Delay to ensure controls are ready
      setTimeout(setupEyeButton, 500);
    }
  }, [playerReady]);

  // When showProgressBar changes, update visibility
  useEffect(() => {
    if (player && playerReady) {
      // Update the eye button icon
      updateEyeButtonIcon(showProgressBar);
      
      // Update progress and time visibility
      updateProgressVisibility(showProgressBar);
    }
  }, [showProgressBar]);

  // Update the eye button icon based on state
  const updateEyeButtonIcon = (showProgress) => {
    const eyeButton = document.querySelector('.plyr__eye-toggle');
    if (eyeButton) {
      const eyeOpenSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"></path><circle cx="12" cy="12" r="3"></circle></svg>`;
      const eyeClosedSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9.88 9.88a3 3 0 1 0 4.24 4.24"></path><path d="M10.73 5.08A10.43 10.43 0 0 1 12 5c7 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68"></path><path d="M6.61 6.61A13.526 13.526 0 0 0 2 12s3 7 10 7a9.74 9.74 0 0 0 5.39-1.61"></path><line x1="2" x2="22" y1="2" y2="22"></line></svg>`;
      eyeButton.innerHTML = showProgress ? eyeOpenSvg : eyeClosedSvg;
      eyeButton.setAttribute('aria-label', showProgress ? 'Hide progress' : 'Show progress');
    }
  };
  
  // Update progress bar and time display visibility
  const updateProgressVisibility = (showProgress) => {
    if (!player || !player.elements || !player.elements.controls) return;
    
    // Hide/show progress container
    const progressContainer = player.elements.controls.querySelector('.plyr__progress__container');
    if (progressContainer) {
      progressContainer.style.display = showProgress ? 'flex' : 'none';
    }
    
    // Also hide/show current time
    const timeDisplay = player.elements.controls.querySelector('.plyr__time--current');
    if (timeDisplay) {
      timeDisplay.style.display = showProgress ? 'block' : 'none';
    }
  };

  // Add custom eye button to the Plyr control bar - only called once
  const addCustomButton = () => {
    if (!player || !playerReady) return;
    
    const controlBar = document.querySelector('.plyr__controls');
    if (!controlBar) {
      console.log('Control bar not found, retrying...');
      setTimeout(addCustomButton, 300);
      return;
    }
    
    // Check if button already exists to avoid duplicates
    if (document.querySelector('.plyr__eye-toggle')) {
      console.log('Eye button already exists, not adding another');
      return;
    }
    
    // Create button element - style it like Plyr's native buttons
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'plyr__control plyr__eye-toggle';
    button.setAttribute('data-plyr', 'eye-toggle');
    button.setAttribute('aria-label', showProgressBar ? 'Hide progress' : 'Show progress');
    
    // Add icon - using Lucide SVG directly
    const eyeOpenSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"></path><circle cx="12" cy="12" r="3"></circle></svg>`;
    
    button.innerHTML = eyeOpenSvg;
    
    // Add click handler
    button.addEventListener('click', toggleProgressBar);
    
    // Try to insert before fullscreen button
    const fullscreenButton = controlBar.querySelector('[data-plyr="fullscreen"]');
    if (fullscreenButton) {
      controlBar.insertBefore(button, fullscreenButton);
    } else {
      // Fallback: append to the end
      controlBar.appendChild(button);
    }
    
    console.log('Eye button added successfully');
  };

  // Toggle progress bar visibility
  const toggleProgressBar = () => {
    setShowProgressBar(prev => !prev);
  };

  // Handle video ID change
  const handleVideoChange = (e) => {
    e.preventDefault();
    // Extract video ID if full URL is pasted
    let newId = inputVideoId;
    if (inputVideoId.includes('youtube.com/watch?v=')) {
      try {
        const url = new URL(inputVideoId);
        newId = url.searchParams.get('v');
      } catch (error) {
        console.error('Invalid URL', error);
      }
    } else if (inputVideoId.includes('youtu.be/')) {
      const parts = inputVideoId.split('youtu.be/');
      if (parts.length > 1) {
        newId = parts[1].split('?')[0];
      }
    }
    
    if (newId) {
      setVideoId(newId);
      setInputVideoId('');
    }
  };
  
  // Handle script loaded
  const handleScriptLoaded = () => {
    console.log('Plyr script loaded');
    setScriptsLoaded(true);
  };

  return (
    <>
      {/* Load Plyr CSS */}
      <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/plyr/3.7.8/plyr.css" />
      
      {/* Load Plyr JS with callback */}
      <Script 
        src="https://cdnjs.cloudflare.com/ajax/libs/plyr/3.7.8/plyr.polyfilled.js"
        onLoad={handleScriptLoaded}
      />

      <div className="max-w-4xl mx-auto p-4 md:p-8">
        <h1 className="text-2xl font-bold text-center mb-6">Custom Video Player with Progress Toggle</h1>
        
        <div className="relative">
          {/* Plyr Video Player */}
          <div className="relative pb-[56.25%] h-0 overflow-hidden rounded-lg shadow-lg bg-black">
            <div ref={playerRef} className="absolute top-0 left-0 w-full h-full">
              <div id="player" data-plyr-provider="youtube" data-plyr-embed-id={videoId}></div>
            </div>
          </div>
        </div>
        
        {/* Video Input Form */}
        <form onSubmit={handleVideoChange} className="mt-6 flex flex-col sm:flex-row gap-2">
          <input
            type="text"
            value={inputVideoId}
            onChange={(e) => setInputVideoId(e.target.value)}
            placeholder="Enter YouTube video ID or URL"
            className="flex-1 p-3 border border-gray-300 rounded"
          />
          <button 
            type="submit" 
            className="bg-blue-600 hover:bg-blue-700 text-white p-3 rounded font-medium"
          >
            Play Video
          </button>
        </form>
        
        <div className="mt-4 text-center text-gray-600">
          <p>
            {showProgressBar 
              ? "Progress bar is visible. Click the eye icon next to fullscreen to hide it." 
              : "Progress bar is hidden. Click the eye icon to show it."}
          </p>
        </div>
      </div>
      
      {/* Custom CSS to style our button like native Plyr controls */}
      <style jsx global>{`
        /* Style our custom eye icon to match Plyr's controls */
        .plyr__eye-toggle svg {
          display: block;
          width: 18px;
          height: 18px;
          fill: none;
          stroke: currentColor;
          stroke-width: 2;
          stroke-linecap: round;
          stroke-linejoin: round;
        }
        
        /* Position the button correctly */
        .plyr__controls .plyr__eye-toggle {
          order: 97; /* Position right before fullscreen which is 98 */
        }
      `}</style>
    </>
  );
}