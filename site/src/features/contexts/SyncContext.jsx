/**
 * SyncContext
 * Provides a central context for data synchronization across the application
 * This connects to the original codebase's pub/sub system and exposes data
 * from multiple sources (plugin, Wise Old Man, Wiki)
 */

import React, { createContext, useContext, useState, useEffect } from 'react';
import dataSyncService from '../data-sync/data-sync-service';

const SyncContext = createContext(null);

export function SyncProvider({ children }) {
  const [syncData, setSyncData] = useState({
    sources: {
      plugin: { enabled: true, data: null },
      wiseOldMan: { enabled: true, data: null },
      wiki: { enabled: true, data: null }
    },
    members: [],
    lastUpdate: null
  });
  
  // Initialize data sync service when the component mounts
  useEffect(() => {
    console.log("SyncContext: Ensuring dataSyncService is initialized");
    if (!dataSyncService.initialized) {
      dataSyncService.initialize();
    }
    console.log("SyncContext: dataSyncService initialized successfully");
    
    const updateSyncData = (data) => {
      setSyncData({
        ...data,
        lastUpdate: Date.now()
      });
    };
    
    // Try multiple methods to hook into the data update system
    let unsubscribe;
    
    // Method 1: Using pubsub from the original codebase
    try {
      if (window.pubsub && typeof window.pubsub.subscribe === 'function') {
        unsubscribe = window.pubsub.subscribe('multi-source-data-updated', updateSyncData);
      }
    } catch (error) {
      console.error('Error setting up pubsub listener:', error);
    }
    
    // Method 2: Using the data sync service's direct event
    try {
      const handler = (event) => {
        if (event && event.detail) {
          updateSyncData(event.detail);
        }
      };
      document.addEventListener('multi-source-data-updated', handler);
      
      // Add cleanup for this listener
      const documentCleanup = () => document.removeEventListener('multi-source-data-updated', handler);
      if (!unsubscribe) unsubscribe = documentCleanup;
      else {
        const originalUnsubscribe = unsubscribe;
        unsubscribe = () => {
          originalUnsubscribe();
          documentCleanup();
        };
      }
    } catch (error) {
      console.error('Error setting up DOM event listener:', error);
    }
    
    // Method 3: Try to use the original group data listener
    try {
      import('../../data/group-data').then(module => {
        if (module && typeof module.addGroupDataListener === 'function') {
          const groupDataUnsubscribe = module.addGroupDataListener((groupData) => {
            if (groupData) {
              setSyncData(prevData => ({
                ...prevData,
                sources: {
                  ...prevData.sources,
                  plugin: { enabled: true, data: groupData }
                },
                lastUpdate: Date.now()
              }));
            }
          });
          
          // Add cleanup for this listener
          if (!unsubscribe) unsubscribe = groupDataUnsubscribe;
          else {
            const originalUnsubscribe = unsubscribe;
            unsubscribe = () => {
              originalUnsubscribe();
              groupDataUnsubscribe();
            };
          }
        }
      }).catch(err => {
        console.error('Error importing group-data module:', err);
      });
    } catch (error) {
      console.error('Error setting up group data listener:', error);
    }
    
    // Return cleanup function
    return () => {
      if (unsubscribe && typeof unsubscribe === 'function') {
        unsubscribe();
      }
    };
  }, []);
  
  // Create the context value object with data and helper functions
  const contextValue = {
    ...syncData,
    getPlayerData: (playerName) => {
      if (!playerName) return null;
      const lowerName = playerName.toLowerCase();
      return syncData.members.find(m => m.name.toLowerCase() === lowerName) || null;
    },
    getAllPlayers: () => syncData.members || [],
    refreshData: () => {
      dataSyncService.fetchExternalData();
    },
    dataSyncService
  };
  
  return (
    <SyncContext.Provider value={contextValue}>
      {children}
    </SyncContext.Provider>
  );
}

// Custom hook for consuming the context
export function useSyncContext() {
  const context = useContext(SyncContext);
  if (!context) {
    throw new Error('useSyncContext must be used within a SyncProvider');
  }
  return context;
}

export default SyncContext;
