import React from 'react';
import Toolbar from './Toolbar';
import SlideList from './SlideList';
import Canvas from './Canvas';

const Editor = () => {
    return (
        <div className="editor-layout">
            <header className="editor-header">
                <div className="logo">Nursing PPT</div>
                <Toolbar />
            </header>
            <div className="editor-body">
                <aside className="editor-sidebar">
                    <SlideList />
                </aside>
                <main className="editor-main">
                    <div className="canvas-wrapper">
                        <Canvas />
                    </div>
                </main>
            </div>
        </div>
    );
};

export default Editor;
