'use client';

import { useState, useEffect, useRef } from 'react';
import Script from 'next/script';

export default function CustomVideoPlayer() {
  const [showProgressBar, setShowProgressBar] = useState(true);
  const [videoId, setVideoId] = useState('dQw4w9WgXcQ'); // Default YouTube video ID
  const [inputVideoId, setInputVideoId] = useState('');
  const [showTip, setShowTip] = useState(true); // State to control the tip visibility
  const playerRef = useRef(null);
  const buttonRef = useRef(null);
  const [player, setPlayer] = useState(null);
  const [playerReady, setPlayerReady] = useState(false);
  const [scriptsLoaded, setScriptsLoaded] = useState(false);

  // Always include all controls in the same order for consistent layout
  const getControlsConfig = () => {
    return [
      'play-large',
      'play',
      'mute',
      'volume',
      'current-time',
      'progress',
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
      // Setup global document listener for our custom button (delegated approach)
      const documentClickHandler = (e) => {
        const clickedButton = e.target.closest('.plyr__eye-toggle, #plyr-eye-toggle-btn');
        if (clickedButton) {
          e.preventDefault();
          e.stopPropagation();
          toggleProgressBar(e);
          
          // Hide the tip when the button is clicked
          if (showTip) {
            setShowTip(false);
          }
          
          return false;
        }
      };
      
      // Add global click handler
      document.addEventListener('click', documentClickHandler);
      
      // Add the custom button on initial load
      const setupEyeButton = () => {
        addCustomButton();
        
        // Apply initial visibility state to progress bar and time
        setTimeout(() => {
          updateProgressVisibility(showProgressBar);
        }, 100);
      };
      
      // Delay to ensure controls are ready
      setTimeout(setupEyeButton, 500);
      
      // Cleanup function to remove event listener when component unmounts
      return () => {
        document.removeEventListener('click', documentClickHandler);
      };
    }
  }, [playerReady, showTip]);

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
      // Using Material Design style icons
      const eyeOpenSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24"><path fill="currentColor" d="M12 9a3 3 0 0 1 3 3a3 3 0 0 1-3 3a3 3 0 0 1-3-3a3 3 0 0 1 3-3m0-4.5c5 0 9.27 3.11 11 7.5c-1.73 4.39-6 7.5-11 7.5S2.73 16.39 1 12c1.73-4.39 6-7.5 11-7.5M3.18 12a9.821 9.821 0 0 0 17.64 0a9.821 9.821 0 0 0-17.64 0Z"/></svg>`;
      const eyeClosedSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24"><path fill="currentColor" d="M2 5.27L3.28 4L20 20.72L18.73 22l-3.08-3.08c-1.15.38-2.37.58-3.65.58c-5 0-9.27-3.11-11-7.5c.69-1.76 1.79-3.31 3.19-4.54L2 5.27M12 9a3 3 0 0 1 3 3a3 3 0 0 1-.17 1L11 9.17A3 3 0 0 1 12 9m0-4.5c5 0 9.27 3.11 11 7.5a11.79 11.79 0 0 1-4 5.19l-1.42-1.43A9.862 9.862 0 0 0 20.82 12A9.821 9.821 0 0 0 12 6.5c-1.09 0-2.16.18-3.16.5L7.3 5.47c1.44-.62 3.03-.97 4.7-.97M3.18 12A9.821 9.821 0 0 0 12 17.5c.69 0 1.37-.07 2.03-.2L10.6 14c-.6-.5-1.08-1.2-1.43-1.96L7.42 10.8c-1.78 1.1-3.33 2.78-4.24 4.7Z"/></svg>`;
      eyeButton.innerHTML = showProgress ? eyeOpenSvg : eyeClosedSvg;
      eyeButton.setAttribute('aria-label', showProgress ? 'Hide progress' : 'Show progress');
    }
  };
  
  // Update progress bar and time display visibility without affecting layout
  const updateProgressVisibility = (showProgress) => {
    if (!player || !player.elements || !player.elements.controls) return;
    
    // We're using visibility and opacity instead of display
    // This preserves the DOM layout and prevents controls from shifting
    const progressContainer = player.elements.controls.querySelector('.plyr__progress__container');
    if (progressContainer) {
      progressContainer.style.visibility = showProgress ? 'visible' : 'hidden';
      progressContainer.style.opacity = showProgress ? '1' : '0';
      progressContainer.style.pointerEvents = showProgress ? 'auto' : 'none';
      // Keep the space it takes up to prevent layout shifts
      progressContainer.style.width = progressContainer.style.width || progressContainer.offsetWidth + 'px';
      progressContainer.style.minWidth = showProgress ? '' : '1px';
    }
    
    // Same approach for time display
    const timeDisplay = player.elements.controls.querySelector('.plyr__time--current');
    if (timeDisplay) {
      timeDisplay.style.visibility = showProgress ? 'visible' : 'hidden';
      timeDisplay.style.opacity = showProgress ? '1' : '0';
      // Keep the space it takes up to prevent layout shifts
      if (!showProgress && timeDisplay.offsetWidth > 0) {
        timeDisplay.style.width = timeDisplay.offsetWidth + 'px';
      }
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
      console.log('Eye button already exists, updating reference');
      buttonRef.current = document.querySelector('.plyr__eye-toggle');
      return;
    }
    
    // Create button element - style it like Plyr's native buttons
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'plyr__control plyr__eye-toggle';
    button.id = 'plyr-eye-toggle-btn';
    button.setAttribute('data-plyr', 'eye-toggle');
    button.setAttribute('aria-label', showProgressBar ? 'Hide progress' : 'Show progress');
    
    // Add icon - Material Design style
    const eyeOpenSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24"><path fill="currentColor" d="M12 9a3 3 0 0 1 3 3a3 3 0 0 1-3 3a3 3 0 0 1-3-3a3 3 0 0 1 3-3m0-4.5c5 0 9.27 3.11 11 7.5c-1.73 4.39-6 7.5-11 7.5S2.73 16.39 1 12c1.73-4.39 6-7.5 11-7.5M3.18 12a9.821 9.821 0 0 0 17.64 0a9.821 9.821 0 0 0-17.64 0Z"/></svg>`;
    
    button.innerHTML = eyeOpenSvg;
    
    // Store reference
    buttonRef.current = button;
    
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
  const toggleProgressBar = (e) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    
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
            
            {/* Onboarding tip that points to the eye button */}
            {showTip && playerReady && (
              <div className="onboarding-tip">
                <div className="tip-content">
                  <p>Click this button to hide the progress bar</p>
                  <svg className="arrow" viewBox="0 0 50 50" width="40" height="40">
                    <path d="M10,10 L30,25 L10,40" />
                  </svg>
                </div>
              </div>
            )}
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
      
      {/* Custom CSS to style our button like native Plyr controls and fix layout */}
      <style jsx global>{`
        /* Style our custom eye icon to match Plyr's controls */
        .plyr__eye-toggle svg {
          display: block;
          width: 18px;
          height: 18px;
          fill: currentColor;
        }
        
        /* Position the button correctly */
        .plyr__controls .plyr__eye-toggle {
          order: 97; /* Position right before fullscreen which is 98 */
        }
        
        /* Ensure volume controls remain on the left */
        .plyr__controls [data-plyr="mute"] {
          order: 2;
          margin-left: 8px !important;
        }
        
        .plyr__controls .plyr__volume {
          order: 3;
          margin-left: 0 !important;
        }
        
        /* Position play button */
        .plyr__controls [data-plyr="play"] {
          order: 1;
        }
        
        /* Position time display */
        .plyr__controls .plyr__time {
          order: 4;
          min-width: 45px; /* Ensure minimum width to preserve space */
        }
        
        /* Position progress bar */
        .plyr__controls .plyr__progress__container {
          order: 5;
          flex-grow: 1;
          transition: opacity 0.2s ease;
          /* Preserve layout with minimum width when hidden */
          min-width: 1px;
        }
        
        /* Position other controls to the right */
        .plyr__controls [data-plyr="captions"] {
          order: 90;
          margin-left: auto !important; /* Push to right side */
        }
        
        .plyr__controls [data-plyr="settings"] {
          order: 91;
        }
        
        .plyr__controls [data-plyr="pip"] {
          order: 92;
        }
        
        .plyr__controls [data-plyr="airplay"] {
          order: 93;
        }
        
        .plyr__controls [data-plyr="fullscreen"] {
          order: 98;
        }
        
        /* Keep flex container stable */
        .plyr__controls {
          display: flex !important;
          flex-wrap: nowrap !important;
          align-items: center !important;
          justify-content: flex-start !important;
          gap: 0 !important;
        }
        
        /* Left controls group (to keep them together) */
        .plyr__controls::before {
          content: '';
          order: 0;
          width: 0;
          display: none;
        }
        
        /* Creates separation between left and right controls */
        .plyr__controls::after {
          content: '';
          order: 89;
          flex-grow: 0;
          width: 0;
          display: none;
        }
        
        /* Onboarding tip styling */
        .onboarding-tip {
          position: absolute;
          bottom: -10px; /* Increased from 6px to move it down */
          right: 80px;
          z-index: 100;
          pointer-events: none;
          animation: fadeIn 0.5s ease-out;
        }
        
        .tip-content {
          display: flex;
          align-items: center;
          background: rgba(0, 0, 0, 0.7);
          color: white;
          font-size: 14px;
          padding: 8px 14px;
          border-radius: 6px;
          box-shadow: 0 2px 10px rgba(0, 0, 0, 0.2);
          max-width: 180px;
        }
        
        .tip-content p {
          margin: 0;
          padding: 0;
          line-height: 1.4;
        }
        
        .arrow {
          fill: none;
          stroke: white;
          stroke-width: 3;
          margin-left: 10px;
          animation: pointRight 1.5s infinite ease-in-out;
        }
        
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        
        @keyframes pointRight {
          0%, 100% { transform: translateX(0); }
          50% { transform: translateX(5px); }
        }
        
        /* Make the tip responsive */
        @media (max-width: 640px) {
          .onboarding-tip {
            bottom: 50px; /* Increased from 40px to move it down on mobile */
            right: 20px;
          }
          
          .tip-content {
            font-size: 12px;
            padding: 6px 10px;
            flex-direction: column;
          }
          
          .arrow {
            margin-left: 0;
            margin-top: 8px;
            transform: rotate(90deg);
          }
          
          @keyframes pointRight {
            0%, 100% { transform: rotate(90deg) translateX(0); }
            50% { transform: rotate(90deg) translateX(5px); }
          }
        }
      `}</style>
    </>
  );
}