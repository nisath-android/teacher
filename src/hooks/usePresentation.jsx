import { useState, createContext, useContext, useEffect } from 'react';

const PresentationContext = createContext();

export const usePresentation = () => useContext(PresentationContext);

export const PresentationProvider = ({ children }) => {
  const [slides, setSlides] = useState([
    { id: 1, elements: [] } 
  ]);
  const [currentSlideId, setCurrentSlideId] = useState(1);
  const [selectedElementId, setSelectedElementId] = useState(null);

  const currentSlide = slides.find(s => s.id === currentSlideId);

  const addSlide = () => {
    const newId = Math.max(...slides.map(s => s.id), 0) + 1;
    setSlides([...slides, { id: newId, elements: [] }]);
    setCurrentSlideId(newId);
  };

  const deleteSlide = (id) => {
    if (slides.length === 1) return;
    const newSlides = slides.filter(s => s.id !== id);
    setSlides(newSlides);
    if (currentSlideId === id) {
      setCurrentSlideId(newSlides[0].id);
    }
  };

  const addElement = (type, content = '') => {
    if (!currentSlide) return;
    const newElement = {
      id: Date.now(),
      type, // 'text' or 'image'
      x: 100,
      y: 100,
      width: type === 'text' ? 300 : 200,
      height: type === 'text' ? 50 : 200,
      content: content || (type === 'text' ? 'Double click to edit' : ''),
      style: {
        fontSize: 24,
        color: '#000000',
        backgroundColor: 'transparent',
        fontWeight: 'normal',
        fontStyle: 'normal',
      }
    };

    const updatedSlides = slides.map(s => {
      if (s.id === currentSlideId) {
        return { ...s, elements: [...s.elements, newElement] };
      }
      return s;
    });
    setSlides(updatedSlides);
    setSelectedElementId(newElement.id);
  };

  const updateElement = (id, updates) => {
    const updatedSlides = slides.map(s => {
      if (s.id === currentSlideId) {
        const updatedElements = s.elements.map(el => {
          if (el.id === id) {
            return { ...el, ...updates };
          }
          return el;
        });
        return { ...s, elements: updatedElements };
      }
      return s;
    });
    setSlides(updatedSlides);
  };
  
  const removeElement = (id) => {
      const updatedSlides = slides.map(s => {
      if (s.id === currentSlideId) {
        const updatedElements = s.elements.filter(el => el.id !== id);
        return { ...s, elements: updatedElements };
      }
      return s;
    });
    setSlides(updatedSlides);
    setSelectedElementId(null);
  }

  return (
    <PresentationContext.Provider value={{
      slides,
      currentSlideId,
      currentSlide,
      selectedElementId,
      setCurrentSlideId,
      setSelectedElementId,
      addSlide,
      deleteSlide,
      addElement,
      updateElement,
      removeElement
    }}>
      {children}
    </PresentationContext.Provider>
  );
};
