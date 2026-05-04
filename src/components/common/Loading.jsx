// src/components/common/Loading.jsx
import './Loading.css';

const Loading = ({ fullPage = true, message = "" }) => {
    return (
        <div className={fullPage ? "loading-wrapper" : "loading-container"}>
            <div className="loading">
                <span></span>
                <span></span>
                <span></span>
                <span></span>
                <span></span>
            </div>
            {message && <p style={{ marginTop: '1rem', color: '#64748b', fontWeight: '500' }}>{message}</p>}
        </div>
    );
};

export default Loading;
