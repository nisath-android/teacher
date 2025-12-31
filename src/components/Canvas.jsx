import React, { useRef } from 'react';
import { Rnd } from 'react-rnd';
import { usePresentation } from '../hooks/usePresentation';

const Canvas = () => {
    const {
        currentSlide,
        selectedElementId,
        setSelectedElementId,
        updateElement
    } = usePresentation();
    const fileInputRef = useRef(null);

    if (!currentSlide) return <div className="canvas-empty">No slide selected</div>;

    const handleElementClick = (e, id) => {
        e.stopPropagation();
        setSelectedElementId(id);
    };

    const handleCanvasClick = () => {
        setSelectedElementId(null);
    };

    const handleContentChange = (id, newContent) => {
        updateElement(id, { content: newContent });
    }

    return (
        <div className="canvas-container" onClick={handleCanvasClick}>
            <div className="slide-canvas">
                {currentSlide.elements.map((el) => (
                    <Rnd
                        key={el.id}
                        size={{ width: el.width, height: el.height }}
                        position={{ x: el.x, y: el.y }}
                        onDragStop={(e, d) => {
                            updateElement(el.id, { x: d.x, y: d.y });
                        }}
                        onResizeStop={(e, direction, ref, delta, position) => {
                            updateElement(el.id, {
                                width: ref.style.width,
                                height: ref.style.height,
                                ...position,
                            });
                        }}
                        bounds="parent"
                        className={selectedElementId === el.id ? 'element-selected' : ''}
                        onClick={(e) => handleElementClick(e, el.id)}
                    >
                        <div
                            style={{
                                width: '100%',
                                height: '100%',
                                ...el.style,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                overflow: 'hidden',
                                cursor: 'move'
                            }}
                        >
                            {el.type === 'text' ? (
                                <div
                                    contentEditable
                                    suppressContentEditableWarning
                                    style={{ width: '100%', height: '100%', outline: 'none' }}
                                    onBlur={(e) => handleContentChange(el.id, e.target.innerText)}
                                >
                                    {el.content}
                                </div>
                            ) : (
                                <img src={el.content} alt="slide-img" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                            )}
                        </div>
                    </Rnd>
                ))}
            </div>
        </div>
    );
};

export default Canvas;
