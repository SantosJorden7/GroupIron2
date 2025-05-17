/**
 * WikiContext
 * Provides a central context for wiki data across the application
 * Connects to the OSRS Wiki API for item data, quest information, and more
 */

import React, { createContext, useContext, useState, useEffect } from 'react';
import { wikiService } from './wiki-service';

// Create the context
const WikiContext = createContext(null);

export function WikiProvider({ children }) {
  const [wikiState, setWikiState] = useState({
    isLoading: true,
    lastUpdate: null,
    error: null,
    itemData: {},
    questData: {},
    bossData: {},
    skillData: {}
  });

  // Initialize the wiki service and load data
  useEffect(() => {
    const initializeWikiData = async () => {
      try {
        console.log('WikiContext: Initializing wiki service');
        
        // Initialize the wiki service
        if (!wikiService.initialized) {
          await wikiService.initialize();
        }
        
        // Load initial data
        const itemData = await wikiService.getItems();
        const questData = await wikiService.getQuests();
        const bossData = await wikiService.getBosses();
        const skillData = await wikiService.getSkills();
        
        setWikiState({
          isLoading: false,
          lastUpdate: Date.now(),
          error: null,
          itemData: itemData || {},
          questData: questData || {},
          bossData: bossData || {},
          skillData: skillData || {}
        });
        
        console.log('Wiki data loaded:', Object.keys(itemData || {}).length, 'items');
      } catch (error) {
        console.error('Error initializing wiki data:', error);
        setWikiState(prev => ({
          ...prev,
          isLoading: false,
          error: error.message || 'Failed to load wiki data'
        }));
      }
    };
    
    // Initialize data
    initializeWikiData();
    
    // Set up data refresh interval (every 24 hours)
    const refreshInterval = setInterval(() => {
      console.log('Refreshing wiki data');
      initializeWikiData();
    }, 24 * 60 * 60 * 1000);
    
    // Clean up
    return () => {
      clearInterval(refreshInterval);
    };
  }, []);
  
  // Create a handler for refreshing the data manually
  const refreshWikiData = async () => {
    try {
      setWikiState(prev => ({ ...prev, isLoading: true }));
      
      // Refresh all data
      const itemData = await wikiService.getItems(true); // Force refresh
      const questData = await wikiService.getQuests(true);
      const bossData = await wikiService.getBosses(true);
      const skillData = await wikiService.getSkills(true);
      
      setWikiState({
        isLoading: false,
        lastUpdate: Date.now(),
        error: null,
        itemData: itemData || {},
        questData: questData || {},
        bossData: bossData || {},
        skillData: skillData || {}
      });
      
      return true;
    } catch (error) {
      console.error('Error refreshing wiki data:', error);
      setWikiState(prev => ({
        ...prev,
        isLoading: false,
        error: error.message || 'Failed to refresh wiki data'
      }));
      return false;
    }
  };
  
  // Create helper function to get item data
  const getItem = (itemId) => {
    if (!itemId) return null;
    
    // Convert string IDs to numbers if needed
    const id = typeof itemId === 'string' ? parseInt(itemId, 10) : itemId;
    
    return wikiState.itemData[id] || null;
  };
  
  // Create helper function to get item price
  const getItemPrice = (itemId) => {
    const item = getItem(itemId);
    return item ? item.price || 0 : 0;
  };
  
  // Create helper function to get quest data
  const getQuest = (questName) => {
    if (!questName) return null;
    
    // Normalize the quest name for lookup
    const normalizedName = questName.toLowerCase().trim();
    
    // Find the quest by name
    return Object.values(wikiState.questData).find(
      quest => quest.name.toLowerCase() === normalizedName
    ) || null;
  };
  
  // Create helper function to get boss data
  const getBoss = (bossName) => {
    if (!bossName) return null;
    
    // Normalize the boss name for lookup
    const normalizedName = bossName.toLowerCase().trim();
    
    // Find the boss by name
    return Object.values(wikiState.bossData).find(
      boss => boss.name.toLowerCase() === normalizedName
    ) || null;
  };
  
  // Create helper function to get skill data
  const getSkill = (skillName) => {
    if (!skillName) return null;
    
    // Normalize the skill name for lookup
    const normalizedName = skillName.toLowerCase().trim();
    
    // Find the skill by name
    return Object.values(wikiState.skillData).find(
      skill => skill.name.toLowerCase() === normalizedName
    ) || null;
  };
  
  // Create the context value object with state and helper functions
  const contextValue = {
    ...wikiState,
    refreshWikiData,
    getItem,
    getItemPrice,
    getQuest,
    getBoss,
    getSkill,
    wikiService
  };
  
  return (
    <WikiContext.Provider value={contextValue}>
      {children}
    </WikiContext.Provider>
  );
}

// Custom hook for consuming the context
export function useWikiContext() {
  const context = useContext(WikiContext);
  if (!context) {
    throw new Error('useWikiContext must be used within a WikiProvider');
  }
  return context;
}

export default WikiContext;
