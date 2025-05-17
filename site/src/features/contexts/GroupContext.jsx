/**
 * GroupContext
 * Provides a central context for group information across the application
 * This connects to the original codebase's authentication and group system
 */

import React, { createContext, useContext, useState, useEffect } from 'react';

// Create the context
const GroupContext = createContext(null);

export function GroupProvider({ children }) {
  const [groupInfo, setGroupInfo] = useState({
    name: null,
    token: null,
    members: [],
    isLoggedIn: false,
    isLoading: true
  });

  // Initialize the group info by checking stored credentials and login state
  useEffect(() => {
    console.log("GroupContext: Initializing");
    
    // Function to find the API module
    const findApi = async () => {
      // Try different methods to get API
      if (window.api) {
        return window.api;
      }
      
      // Try to import the API module
      try {
        const module = await import('../../data/api');
        return module.api;
      } catch (err) {
        console.error('Error importing API module:', err);
        return null;
      }
    };
    
    // Function to find the storage module
    const findStorage = async () => {
      // Try different methods to get storage
      if (window.storage) {
        return window.storage;
      }
      
      // Try to import the storage module
      try {
        const module = await import('../../data/storage');
        return module.storage;
      } catch (err) {
        console.error('Error importing storage module:', err);
        
        // Create a minimal storage interface as fallback
        return {
          getGroup: () => {
            try {
              const stored = localStorage.getItem('group');
              return stored ? JSON.parse(stored) : null;
            } catch (e) {
              return null;
            }
          }
        };
      }
    };
    
    // Check login state and set up group info
    const initializeGroupInfo = async () => {
      try {
        // Find required modules
        const api = await findApi();
        const storage = await findStorage();
        
        if (!api || !storage) {
          console.error('Required modules not found');
          setGroupInfo(prev => ({
            ...prev,
            isLoading: false
          }));
          return;
        }
        
        // Get stored group info
        const storedGroup = storage.getGroup();
        
        if (storedGroup) {
          // Set credentials from stored info
          api.setCredentials(storedGroup.name, storedGroup.token);
          
          // Check if actually logged in
          try {
            const response = await api.amILoggedIn();
            const isLoggedIn = response && response.ok;
            
            setGroupInfo({
              name: storedGroup.name,
              token: storedGroup.token,
              members: [],
              isLoggedIn,
              isLoading: false
            });
            
            console.log(`GroupContext: User ${isLoggedIn ? 'is' : 'is not'} logged in`);
          } catch (err) {
            console.error('Error checking login state:', err);
            setGroupInfo({
              name: storedGroup.name,
              token: storedGroup.token,
              members: [],
              isLoggedIn: false,
              isLoading: false
            });
          }
        } else {
          // No stored credentials
          setGroupInfo(prev => ({
            ...prev,
            isLoading: false
          }));
        }
      } catch (err) {
        console.error('Error initializing group info:', err);
        setGroupInfo(prev => ({
          ...prev,
          isLoading: false
        }));
      }
    };
    
    // Initialize the group info
    initializeGroupInfo();
    
    // Subscribe to login and logout events
    const setupEventListeners = () => {
      // Login success handler
      const handleLoginSuccess = (data) => {
        const { groupName } = data || {};
        if (groupName) {
          setGroupInfo(prev => ({
            ...prev,
            name: groupName,
            isLoggedIn: true,
            isLoading: false
          }));
        }
      };
      
      // Logout handler
      const handleLogout = () => {
        setGroupInfo({
          name: null,
          token: null,
          members: [],
          isLoggedIn: false,
          isLoading: false
        });
      };
      
      // Try to use pubsub
      let unsubscribeLogin, unsubscribeLogout;
      
      if (window.pubsub && typeof window.pubsub.subscribe === 'function') {
        unsubscribeLogin = window.pubsub.subscribe('login-success', handleLoginSuccess);
        unsubscribeLogout = window.pubsub.subscribe('logout', handleLogout);
      }
      
      // Also add DOM event listeners as fallback
      document.addEventListener('login-success', (event) => {
        if (event && event.detail) {
          handleLoginSuccess(event.detail);
        }
      });
      
      document.addEventListener('logout', handleLogout);
      
      // Return cleanup function
      return () => {
        if (unsubscribeLogin) unsubscribeLogin();
        if (unsubscribeLogout) unsubscribeLogout();
        document.removeEventListener('login-success', handleLoginSuccess);
        document.removeEventListener('logout', handleLogout);
      };
    };
    
    // Set up event listeners
    const cleanup = setupEventListeners();
    
    // Clean up when unmounting
    return cleanup;
  }, []);
  
  // Create the context value object
  const contextValue = {
    ...groupInfo,
    isGroupMember: (playerName) => {
      if (!playerName || !groupInfo.members || !groupInfo.members.length) {
        return false;
      }
      return groupInfo.members.some(m => 
        m.toLowerCase() === playerName.toLowerCase()
      );
    }
  };
  
  return (
    <GroupContext.Provider value={contextValue}>
      {children}
    </GroupContext.Provider>
  );
}

// Custom hook for consuming the context
export function useGroupContext() {
  const context = useContext(GroupContext);
  if (!context) {
    throw new Error('useGroupContext must be used within a GroupProvider');
  }
  return context;
}

export default GroupContext;
