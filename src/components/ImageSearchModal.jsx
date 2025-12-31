import React, { useState } from 'react';
import { Search, X, Loader } from 'lucide-react';

const ImageSearchModal = ({ isOpen, onClose, onInsertImage }) => {
    const [query, setQuery] = useState('');
    const [images, setImages] = useState([]);
    const [loading, setLoading] = useState(false);

    if (!isOpen) return null;

    const handleSearch = async (e) => {
        e.preventDefault();
        if (!query.trim()) return;

        setLoading(true);
        try {
            // Wikimedia Commons API via fetch
            const params = new URLSearchParams({
                action: 'query',
                format: 'json',
                prop: 'pageimages',
                generator: 'search',
                gsrsearch: query,
                gsrlimit: '20',
                piprop: 'thumbnail|original',
                pithumbsize: '200',
                origin: '*'
            });

            const response = await fetch(`https://en.wikipedia.org/w/api.php?${params.toString()}`);
            const data = await response.json();

            const pages = data?.query?.pages;
            if (pages) {
                const results = Object.values(pages).map(page => ({
                    id: page.pageid,
                    title: page.title,
                    url: page.original?.source || page.thumbnail?.source,
                    thumbUrl: page.thumbnail?.source
                })).filter(img => img.url);
                setImages(results);
            } else {
                setImages([]);
            }
        } catch (error) {
            console.error("Search failed", error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="modal-overlay">
            <div className="modal-content">
                <div className="modal-header">
                    <h3>Search Images</h3>
                    <button className="close-btn" onClick={onClose}><X size={20} /></button>
                </div>
                <form onSubmit={handleSearch} className="search-form">
                    <input
                        type="text"
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        placeholder="Search for images (e.g., Nature, Technology)..."
                        autoFocus
                    />
                    <button type="submit" disabled={loading}>
                        {loading ? <Loader className="spin" size={20} /> : <Search size={20} />}
                    </button>
                </form>
                <div className="image-grid">
                    {images.map(img => (
                        <div key={img.id} className="image-item" onClick={() => onInsertImage(img.url)}>
                            <img src={img.thumbUrl || img.url} alt={img.title} />
                        </div>
                    ))}
                    {!loading && images.length === 0 && query && <p className="no-results">No images found.</p>}
                </div>
            </div>
        </div>
    );
};

export default ImageSearchModal;
