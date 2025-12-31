import React from 'react';
import { usePresentation } from '../hooks/usePresentation';
import { Trash2 } from 'lucide-react';

const SlideList = () => {
    const { slides, currentSlideId, setCurrentSlideId, deleteSlide } = usePresentation();

    return (
        <div className="slide-list">
            {slides.map((slide, index) => (
                <div
                    key={slide.id}
                    className={`slide-thumbnail ${slide.id === currentSlideId ? 'active' : ''}`}
                    onClick={() => setCurrentSlideId(slide.id)}
                >
                    <div className="slide-number">{index + 1}</div>
                    <div className="slide-preview">
                        {/* Simple preview or can be scaled down representation */}
                        <div className="preview-content">
                            {slide.elements.length > 0 ? (
                                <div className="preview-elements-indicator">
                                    {slide.elements.length} Item(s)
                                </div>
                            ) : (
                                <div className="preview-empty">Empty</div>
                            )}
                        </div>
                    </div>
                    <button
                        className="delete-slide-btn"
                        onClick={(e) => {
                            e.stopPropagation();
                            deleteSlide(slide.id);
                        }}
                    >
                        <Trash2 size={14} />
                    </button>
                </div>
            ))}
        </div>
    );
};

export default SlideList;
