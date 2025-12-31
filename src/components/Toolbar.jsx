import React from 'react';
import { usePresentation } from '../hooks/usePresentation';
import { Type, Image, PlusSquare, Trash2, Download, Languages, FileText, Search, Mic, MicOff } from 'lucide-react';
import pptxgen from 'pptxgenjs';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import { Document, Packer, Paragraph, TextRun, ImageRun } from 'docx';
import { saveAs } from 'file-saver';
import ImageSearchModal from './ImageSearchModal';

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
        removeElement,
        typingLanguage,
        setTypingLanguage,
        updateSlideBackground
    } = usePresentation();

    const [isImageModalOpen, setIsImageModalOpen] = React.useState(false);
    const [isListening, setIsListening] = React.useState(false);

    // Speech to Text Logic
    React.useEffect(() => {
        let recognition = null;
        if (isListening) {
            if ('webkitSpeechRecognition' in window) {
                recognition = new window.webkitSpeechRecognition();
                recognition.continuous = true;
                recognition.interimResults = false;
                recognition.lang = typingLanguage === 'ta' ? 'ta-IN' : 'en-US';

                recognition.onresult = (event) => {
                    const transcript = event.results[event.results.length - 1][0].transcript;
                    if (selectedElementId) {
                        const currentContent = currentSlide?.elements.find(el => el.id === selectedElementId)?.content || '';
                        updateElement(selectedElementId, { content: currentContent + ' ' + transcript });
                    } else {
                        addElement('text', transcript);
                    }
                };

                recognition.onerror = (event) => {
                    console.error("Speech error:", event.error);
                    setIsListening(false);
                };

                recognition.onend = () => {
                    if (isListening) setIsListening(false);
                };

                recognition.start();
            } else {
                alert("Speech recognition is not supported in this browser. Please use Chrome or Edge.");
                setIsListening(false);
            }
        }
        return () => {
            if (recognition) recognition.stop();
        };
    }, [isListening, typingLanguage, selectedElementId, currentSlide, updateElement, addElement]);


    const handleInsertImageFromSearch = (url) => {
        addElement('image', url);
        setIsImageModalOpen(false);
    };

    const handleSpeechToggle = () => {
        setIsListening(!isListening);
    }


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

    const handleExportPDF = async () => {
        const pdf = new jsPDF('l', 'mm', [297, 210]); // A4 Landscape

        // Hide UI elements that shouldn't be captured (like selection borders)
        const selectedElements = document.querySelectorAll('.element-selected');
        selectedElements.forEach(el => el.classList.remove('element-selected'));

        const slideElements = document.querySelectorAll('.slide-canvas');

        for (let i = 0; i < slideElements.length; i++) {
            if (i > 0) pdf.addPage();

            const canvas = await html2canvas(slideElements[i], {
                scale: 2, // Higher scale for better resolution
                useCORS: true,
                backgroundColor: '#ffffff'
            });

            const imgData = canvas.toDataURL('image/png');
            const pdfWidth = pdf.internal.pageSize.getWidth();
            const pdfHeight = pdf.internal.pageSize.getHeight();

            pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
        }

        pdf.save("Presentation.pdf");

        // Restore selection if needed (tricky without state, but user can re-click)
    };

    const handleExportDocs = async () => {
        const doc = new Document({
            sections: [{
                properties: {},
                children: [
                    new Paragraph({
                        children: [
                            new TextRun({
                                text: "Presentation Export",
                                bold: true,
                                size: 48, // 24pt
                            }),
                        ],
                    }),
                    ...slides.flatMap((slide, index) => {
                        const slideChildren = [
                            new Paragraph({
                                text: `Slide ${index + 1}`,
                                heading: "Heading1",
                                spacing: { before: 400, after: 200 }
                            })
                        ];

                        // Sort elements by Y primarily, X secondarily to maintain reading order
                        const sortedElements = [...slide.elements].sort((a, b) => {
                            const yDiff = a.y - b.y;
                            if (Math.abs(yDiff) > 20) return yDiff; // Row priority
                            return a.x - b.x;
                        });

                        sortedElements.forEach(el => {
                            if (el.type === 'text') {
                                slideChildren.push(new Paragraph({
                                    children: [
                                        new TextRun({
                                            text: el.content,
                                            bold: el.style.fontWeight === 'bold',
                                            italics: el.style.fontStyle === 'italic',
                                            size: Math.max(24, el.style.fontSize) // Approximate mapping
                                        })
                                    ]
                                }));
                            } else if (el.type === 'image') {
                                // Converting base64 data URL to buffer/blob is needed for docx
                                // docx requires an ArrayBuffer or Uint8Array or Buffer
                                try {
                                    const data = el.content.split(',')[1];
                                    const binaryString = window.atob(data);
                                    const bytes = new Uint8Array(binaryString.length);
                                    for (let i = 0; i < binaryString.length; i++) {
                                        bytes[i] = binaryString.charCodeAt(i);
                                    }

                                    slideChildren.push(new Paragraph({
                                        children: [
                                            new ImageRun({
                                                data: bytes,
                                                transformation: {
                                                    width: 400,
                                                    height: 300, // Fixed size constraint for doc
                                                },
                                            }),
                                        ],
                                    }));
                                } catch (e) {
                                    console.error("Error processing image for docx", e);
                                    slideChildren.push(new Paragraph({ text: "[Image Error]" }));
                                }
                            }
                        });

                        return slideChildren;
                    })
                ],
            }],
        });

        const blob = await Packer.toBlob(doc);
        saveAs(blob, "Presentation.docx");
    };

    return (
        <div className="toolbar">
            <ImageSearchModal
                isOpen={isImageModalOpen}
                onClose={() => setIsImageModalOpen(false)}
                onInsertImage={handleInsertImageFromSearch}
            />
            <div className="toolbar-group">
                <button className="tool-btn" onClick={addSlide} title="New Slide">
                    <PlusSquare size={20} /> <span className="btn-text">Slide</span>
                </button>
                <button className="tool-btn" onClick={() => addElement('text')} title="Add Text">
                    <Type size={20} /> <span className="btn-text">Text</span>
                </button>
                <button className="tool-btn" onClick={() => setIsImageModalOpen(true)} title="Search Image">
                    <Search size={20} /> <span className="btn-text">Search Img</span>
                </button>
                <label className="tool-btn" title="Add Image">
                    <Image size={20} />
                    <span className="btn-text">Upload Img</span>
                    <input type="file" accept="image/*" onChange={handleImageUpload} hidden />
                </label>
                <button
                    className={`tool-btn ${isListening ? 'active recording' : ''}`}
                    onClick={handleSpeechToggle}
                    title="Speech to Text"
                >
                    {isListening ? <MicOff size={20} color="red" /> : <Mic size={20} />}
                    <span className="btn-text">{isListening ? 'Listening...' : 'Dictate'}</span>
                </button>
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
                <button
                    className={`tool-btn ${typingLanguage === 'ta' ? 'active' : ''}`}
                    onClick={() => setTypingLanguage(typingLanguage === 'ta' ? 'en' : 'ta')}
                    title="Toggle Language (Tamil/English)"
                >
                    <Languages size={20} /> <span className="btn-text">{typingLanguage === 'ta' ? 'தமிழ்' : 'English'}</span>
                </button>
            </div>

            <div className="toolbar-spacer"></div>

            <div className="toolbar-group">
                <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', alignItems: 'center' }}>
                    <span style={{ fontSize: '0.7rem', color: '#94a3b8' }}>Background</span>
                    <div style={{ display: 'flex', gap: '5px' }}>
                        <input
                            type="color"
                            value={currentSlide?.background?.color || '#ffffff'}
                            onChange={(e) => updateSlideBackground(currentSlideId, { color: e.target.value, image: null })}
                            className="color-input"
                            title="Slide Background Color"
                        />
                        <label className="tool-btn" title="Slide Background Image" style={{ padding: '0', height: '32px', width: '32px', justifyContent: 'center' }}>
                            <Image size={16} />
                            <input
                                type="file"
                                accept="image/*"
                                onChange={(e) => {
                                    const file = e.target.files[0];
                                    if (file) {
                                        const reader = new FileReader();
                                        reader.onload = (event) => {
                                            updateSlideBackground(currentSlideId, { image: event.target.result, color: 'transparent' });
                                        };
                                        reader.readAsDataURL(file);
                                    }
                                }}
                                hidden
                            />
                        </label>
                    </div>
                </div>
            </div>

            <div className="toolbar-spacer"></div>

            <div className="toolbar-group">
                <button className="tool-btn primary" onClick={handleExport} title="Download PPTX">
                    <Download size={20} /> <span className="btn-text">PPTX</span>
                </button>
                <button className="tool-btn primary" onClick={handleExportPDF} title="Download PDF">
                    <FileText size={20} /> <span className="btn-text">PDF</span>
                </button>
                <button className="tool-btn primary" onClick={handleExportDocs} title="Download Word Doc">
                    <FileText size={20} /> <span className="btn-text">DOCS</span>
                </button>
            </div>
        </div >
    );
};

export default Toolbar;
