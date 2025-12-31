import React from 'react';
import { usePresentation } from '../hooks/usePresentation';
import { Type, Image, PlusSquare, Trash2, Download } from 'lucide-react';
import pptxgen from 'pptxgenjs';

const Toolbar = () => {
    const {
        addSlide,
        addElement,
        deleteSlide,
        currentSlideId,
        currentSlide,
        selectedElementId,
        updateElement,
        slides,
        removeElement
    } = usePresentation();

    const selectedElement = currentSlide?.elements.find(el => el.id === selectedElementId);

    const handleImageUpload = (e) => {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (event) => {
                addElement('image', event.target.result);
            };
            reader.readAsDataURL(file);
        }
    };

    const handleExport = () => {
        const pres = new pptxgen();

        slides.forEach(slide => {
            const s = pres.addSlide();
            slide.elements.forEach(el => {
                if (el.type === 'text') {
                    s.addText(el.content, {
                        x: el.x / 100, // primitive conversion px to inches approx (need better scale)
                        y: el.y / 100,
                        w: parseInt(el.width) / 100,
                        h: parseInt(el.height) / 100,
                        fontSize: el.style.fontSize,
                        color: el.style.color.replace('#', ''),
                        bold: el.style.fontWeight === 'bold',
                        italic: el.style.fontStyle === 'italic'
                    });
                } else if (el.type === 'image') {
                    s.addImage({
                        data: el.content,
                        x: el.x / 100,
                        y: el.y / 100,
                        w: parseInt(el.width) / 100,
                        h: parseInt(el.height) / 100,
                    });
                }
            });
        });

        pres.writeFile({ fileName: "Presentation.pptx" });
    };

    return (
        <div className="toolbar">
            <div className="toolbar-group">
                <button className="tool-btn" onClick={addSlide} title="New Slide">
                    <PlusSquare size={20} /> <span className="btn-text">Slide</span>
                </button>
                <button className="tool-btn" onClick={() => addElement('text')} title="Add Text">
                    <Type size={20} /> <span className="btn-text">Text</span>
                </button>
                <label className="tool-btn" title="Add Image">
                    <Image size={20} />
                    <span className="btn-text">Image</span>
                    <input type="file" accept="image/*" onChange={handleImageUpload} hidden />
                </label>
            </div>

            <div className="toolbar-divider"></div>

            {selectedElement && selectedElement.type === 'text' && (
                <div className="toolbar-group">
                    <input
                        type="number"
                        value={selectedElement.style.fontSize}
                        onChange={(e) => updateElement(selectedElementId, { style: { ...selectedElement.style, fontSize: parseInt(e.target.value) } })}
                        className="font-size-input"
                        title="Font Size"
                    />
                    <input
                        type="color"
                        value={selectedElement.style.color}
                        onChange={(e) => updateElement(selectedElementId, { style: { ...selectedElement.style, color: e.target.value } })}
                        className="color-input"
                        title="Text Color"
                    />
                    <button
                        className={`tool-btn ${selectedElement.style.fontWeight === 'bold' ? 'active' : ''}`}
                        onClick={() => updateElement(selectedElementId, { style: { ...selectedElement.style, fontWeight: selectedElement.style.fontWeight === 'bold' ? 'normal' : 'bold' } })}
                        title="Bold"
                    >
                        B
                    </button>
                    <button
                        className={`tool-btn ${selectedElement.style.fontStyle === 'italic' ? 'active' : ''}`}
                        onClick={() => updateElement(selectedElementId, { style: { ...selectedElement.style, fontStyle: selectedElement.style.fontStyle === 'italic' ? 'normal' : 'italic' } })}
                        title="Italic"
                    >
                        I
                    </button>
                </div>
            )}

            {selectedElement && (
                <div className="toolbar-group">
                    <button className="tool-btn danger" onClick={() => removeElement(selectedElementId)} title="Delete Element">
                        <Trash2 size={20} />
                    </button>
                </div>
            )}

            <div className="toolbar-spacer"></div>

            <div className="toolbar-group">
                <button className="tool-btn primary" onClick={handleExport} title="Download PPTX">
                    <Download size={20} /> <span className="btn-text">Download</span>
                </button>
            </div>
        </div>
    );
};

export default Toolbar;
