import React, { useState } from 'react';
import ReactDOM from 'react-dom';


const SizeGuideModal = ({ isOpen, onClose }) => {
    const [activeTab, setActiveTab] = useState('women');

    if (!isOpen) return null;

    // Dữ liệu size nữ (áo, váy)
    const womenClothing = [
        { size: 'S', bust: 82, waist: 68, hip: 90, length: 59 },
        { size: 'M', bust: 86, waist: 72, hip: 94, length: 62 },
        { size: 'L', bust: 90, waist: 76, hip: 98, length: 63 },
        { size: 'XL', bust: 94, waist: 80, hip: 102, length: 65 },
    ];
    const womenDress = [
        { size: 'S', bust: 82, waist: 68, hip: 90 },
        { size: 'M', bust: 86, waist: 72, hip: 94 },
        { size: 'L', bust: 90, waist: 76, hip: 98 },
        { size: 'XL', bust: 94, waist: 80, hip: 102 },
    ];

    // Dữ liệu size nam
    const menShirt = [
        { size: 'S', chest: 88, length: 68, shoulder: 44, sleeve: 19 },
        { size: 'M', chest: 92, length: 70, shoulder: 46, sleeve: 20 },
        { size: 'L', chest: 96, length: 72, shoulder: 48, sleeve: 21 },
        { size: 'XL', chest: 100, length: 74, shoulder: 50, sleeve: 22 },
    ];
    const menPants = [
        { size: 'S', waist: 72, hip: 96, length: 98 },
        { size: 'M', waist: 76, hip: 100, length: 100 },
        { size: 'L', waist: 80, hip: 104, length: 102 },
        { size: 'XL', waist: 84, hip: 108, length: 104 },
    ];

    // Dữ liệu size trẻ em
    const kidsClothing = [
        { size: 'XS (2-3 tuổi)', height: 90, chest: 52, length: 40 },
        { size: 'S (4-5 tuổi)', height: 105, chest: 56, length: 45 },
        { size: 'M (6-7 tuổi)', height: 120, chest: 60, length: 50 },
        { size: 'L (8-9 tuổi)', height: 135, chest: 64, length: 55 },
        { size: 'XL (10-11 tuổi)', height: 145, chest: 68, length: 60 },
    ];

    const modalStyles = {
        overlay: {
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            backgroundColor: 'rgba(0,0,0,0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
        },
        container: {
            background: 'white',
            width: '90%',
            maxWidth: '800px',
            maxHeight: '80vh',
            overflowY: 'auto',
            borderRadius: '8px',
            boxShadow: '0 2px 10px rgba(0,0,0,0.3)',
        },
        header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '15px 20px', borderBottom: '1px solid #eee' },
        closeBtn: { background: 'none', border: 'none', fontSize: '24px', cursor: 'pointer' },
        tabs: { display: 'flex', borderBottom: '1px solid #eee' },
        tabButton: { flex: 1, padding: '12px', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 'bold' },
        activeTab: { borderBottom: '2px solid #e7ab3c', color: '#e7ab3c' },
        body: { padding: '20px' },
        table: { width: '100%', borderCollapse: 'collapse', marginBottom: '20px' },
        th: { border: '1px solid #ddd', padding: '8px', backgroundColor: '#f5f5f5', textAlign: 'center' },
        td: { border: '1px solid #ddd', padding: '8px', textAlign: 'center' },
        footer: { padding: '15px', textAlign: 'right', borderTop: '1px solid #eee' },
        btnCloseFooter: { backgroundColor: '#e7ab3c', color: 'white', border: 'none', padding: '8px 20px', borderRadius: '4px', cursor: 'pointer' },
        note: { fontSize: '12px', color: '#999', marginTop: '10px' }
    };

    return ReactDOM.createPortal(
        <div style={modalStyles.overlay} onClick={onClose}>
            <div style={modalStyles.container} onClick={(e) => e.stopPropagation()}>
                <div style={modalStyles.header}>
                    <h4>Hướng dẫn chọn size</h4>
                    <button style={modalStyles.closeBtn} onClick={onClose}>&times;</button>
                </div>
                <div style={modalStyles.tabs}>
                    <button style={{ ...modalStyles.tabButton, ...(activeTab === 'women' ? modalStyles.activeTab : {}) }} onClick={() => setActiveTab('women')}>Nữ</button>
                    <button style={{ ...modalStyles.tabButton, ...(activeTab === 'men' ? modalStyles.activeTab : {}) }} onClick={() => setActiveTab('men')}>Nam</button>
                    <button style={{ ...modalStyles.tabButton, ...(activeTab === 'kids' ? modalStyles.activeTab : {}) }} onClick={() => setActiveTab('kids')}>Trẻ em</button>
                </div>
                <div style={modalStyles.body}>
                    {activeTab === 'women' && (
                        <div>
                            <h5>Áo nữ (sơ mi, T-shirt, hoodie)</h5>
                            <table style={modalStyles.table}>
                                <thead><tr><th style={modalStyles.th}>Size</th><th style={modalStyles.th}>Vòng ngực (cm)</th><th style={modalStyles.th}>Eo (cm)</th><th style={modalStyles.th}>Hông (cm)</th><th style={modalStyles.th}>Dài áo (cm)</th></tr></thead>
                                <tbody>
                                    {womenClothing.map(item => (
                                        <tr key={item.size}><td style={modalStyles.td}>{item.size}</td><td style={modalStyles.td}>{item.bust}</td><td style={modalStyles.td}>{item.waist}</td><td style={modalStyles.td}>{item.hip}</td><td style={modalStyles.td}>{item.length}</td></tr>
                                    ))}
                                </tbody>
                            </table>
                            <h5>Váy nữ</h5>
                            <table style={modalStyles.table}>
                                <thead><tr><th style={modalStyles.th}>Size</th><th style={modalStyles.th}>Vòng ngực (cm)</th><th style={modalStyles.th}>Eo (cm)</th><th style={modalStyles.th}>Hông (cm)</th></tr></thead>
                                <tbody>
                                    {womenDress.map(item => (
                                        <tr key={item.size}><td style={modalStyles.td}>{item.size}</td><td style={modalStyles.td}>{item.bust}</td><td style={modalStyles.td}>{item.waist}</td><td style={modalStyles.td}>{item.hip}</td></tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                    {activeTab === 'men' && (
                        <div>
                            <h5>Áo nam (sơ mi, thun)</h5>
                            <table style={modalStyles.table}>
                                <thead><tr><th style={modalStyles.th}>Size</th><th style={modalStyles.th}>Vòng ngực (cm)</th><th style={modalStyles.th}>Dài áo (cm)</th><th style={modalStyles.th}>Rộng vai (cm)</th><th style={modalStyles.th}>Tay áo (cm)</th></tr></thead>
                                <tbody>
                                    {menShirt.map(item => (
                                        <tr key={item.size}><td style={modalStyles.td}>{item.size}</td><td style={modalStyles.td}>{item.chest}</td><td style={modalStyles.td}>{item.length}</td><td style={modalStyles.td}>{item.shoulder}</td><td style={modalStyles.td}>{item.sleeve}</td></tr>
                                    ))}
                                </tbody>
                            </table>
                            <h5>Quần nam</h5>
                            <table style={modalStyles.table}>
                                <thead><tr><th style={modalStyles.th}>Size</th><th style={modalStyles.th}>Vòng eo (cm)</th><th style={modalStyles.th}>Hông (cm)</th><th style={modalStyles.th}>Dài quần (cm)</th></tr></thead>
                                <tbody>
                                    {menPants.map(item => (
                                        <tr key={item.size}><td style={modalStyles.td}>{item.size}</td><td style={modalStyles.td}>{item.waist}</td><td style={modalStyles.td}>{item.hip}</td><td style={modalStyles.td}>{item.length}</td></tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                    {activeTab === 'kids' && (
                        <div>
                            <h5>Trẻ em (2-11 tuổi)</h5>
                            <table style={modalStyles.table}>
                                <thead><tr><th style={modalStyles.th}>Size</th><th style={modalStyles.th}>Chiều cao (cm)</th><th style={modalStyles.th}>Vòng ngực (cm)</th><th style={modalStyles.th}>Dài áo (cm)</th></tr></thead>
                                <tbody>
                                    {kidsClothing.map(item => (
                                        <tr key={item.size}><td style={modalStyles.td}>{item.size}</td><td style={modalStyles.td}>{item.height}</td><td style={modalStyles.td}>{item.chest}</td><td style={modalStyles.td}>{item.length}</td></tr>
                                    ))}
                                </tbody>
                            </table>
                            <p style={modalStyles.note}>Lưu ý: Nên chọn size lớn hơn 1-2cm so với số đo thực tế để trẻ thoải mái vận động.</p>
                        </div>
                    )}
                </div>
                <div style={modalStyles.footer}>
                    <button style={modalStyles.btnCloseFooter} onClick={onClose}>Đóng</button>
                </div>
            </div>
        </div>,
        document.body
    );
};

export default SizeGuideModal;