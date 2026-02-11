import { useEffect, useRef, useCallback } from 'react';
import { useCreateStore } from '../pages/create/hooks/useCreateStore';

// Simple debounce implementation to reduce deps
function debounce<T extends (...args: any[]) => any>(func: T, wait: number) {
  let timeout: ReturnType<typeof setTimeout>;
  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
}

export const useAutoSave = () => {
  const state = useCreateStore();
  
  // Ref to hold the latest state to avoid closure staleness in the debounced function
  const stateRef = useRef(state);
  
  useEffect(() => {
    stateRef.current = state;
  }, [state]);

  const saveToLocalStorage = useCallback(() => {
    const currentState = stateRef.current;
    
    // Construct the draft object (matching logic in Drafts.tsx)
    const draftData = {
      prompt: currentState.prompt,
      selectedResult: currentState.selectedResult,
      currentStep: currentState.currentStep,
      aiExplanation: currentState.aiExplanation,
      updatedAt: Date.now(),
      // Add other fields that Drafts.tsx might need or for full restoration
      activeTool: currentState.activeTool,
      stylePreset: currentState.stylePreset,
      generatedResults: currentState.generatedResults,
      // Pattern properties
      selectedPatternId: currentState.selectedPatternId,
      patternOpacity: currentState.patternOpacity,
      patternScale: currentState.patternScale,
      patternRotation: currentState.patternRotation,
      patternBlendMode: currentState.patternBlendMode,
      patternTileMode: currentState.patternTileMode,
      patternPositionX: currentState.patternPositionX,
      patternPositionY: currentState.patternPositionY,
    };

    try {
      localStorage.setItem('CREATE_DRAFT', JSON.stringify(draftData));
      // console.log('Auto-saved to CREATE_DRAFT');
    } catch (e) {
      console.error('Auto-save failed', e);
    }
  }, []);

  // Create a debounced version of the save function
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const debouncedSave = useCallback(
    debounce(saveToLocalStorage, 3000), // 3 seconds debounce
    [saveToLocalStorage]
  );

  // Watch for changes in key fields
  useEffect(() => {
    debouncedSave();
  }, [
    state.prompt, 
    state.selectedResult, 
    state.currentStep, 
    state.aiExplanation,
    state.activeTool,
    state.patternOpacity, // Example of watching specific tool props
    debouncedSave
  ]);

  // Also save on unmount
  useEffect(() => {
    return () => {
      saveToLocalStorage();
    };
  }, [saveToLocalStorage]);
};
