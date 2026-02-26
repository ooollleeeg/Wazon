import React from 'react';
import '../../styles/TabContent.css';

function TZIToolsTab() {
  return (
    <div className="tab-layout">
      <main className="tab-main" style={{ justifyContent: 'center', alignItems: 'center' }}>
        <div className="setup-placeholder">
          <div className="placeholder-icon">🛡️</div>
          <h3>Засоби ТЗІ (Технічні засоби захисту інформації)</h3>
          <p>Форма для цієї вкладки в розробці</p>
          <p className="hint">Для формування структури даних контактуйте адміністратора</p>
        </div>
      </main>
    </div>
  );
}

export default TZIToolsTab;