import React from 'react';
import '../../styles/TabContent.css';

function IKSTab() {
  return (
    <div className="tab-layout">
      <main className="tab-main" style={{ justifyContent: 'center', alignItems: 'center' }}>
        <div className="setup-placeholder">
          <div className="placeholder-icon">🌐</div>
          <h3>ІКС (Інформаційно-комунікаційні системи)</h3>
          <p>Форма для цієї вкладки в розробці</p>
          <p className="hint">Для формування структури даних контактуйте адміністратора</p>
        </div>
      </main>
    </div>
  );
}

export default IKSTab;