import React, { useState, useEffect } from 'react';
import MeasurementDevicesList from '../MeasurementDevicesList';
import MeasurementDevicesForm from '../MeasurementDevicesForm';
import MeasurementDevicesCard from '../MeasurementDevicesCard';
import '../../styles/TabContent.css';

function MeasurementDevicesTab() {
  const [devices, setDevices] = useState([]);
  const [selectedDevice, setSelectedDevice] = useState(null);
  const [showForm, setShowForm] = useState(false);

  useEffect(() => {
    fetchDevices();
  }, []);

  const fetchDevices = async () => {
    try {
      const response = await fetch('/api/measurement-devices');
      const data = await response.json();
      setDevices(data);
    } catch (error) {
      console.error('Ошибка загрузки:', error);
    }
  };

  const handleAddDevice = async (deviceData) => {
    try {
      const response = await fetch('/api/measurement-devices', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(deviceData),
      });
      const newDevice = await response.json();
      setDevices([...devices, newDevice]);
      setShowForm(false);
    } catch (error) {
      console.error('Ошибка добавления:', error);
    }
  };

  const handleUpdateDevice = async (id, deviceData) => {
    try {
      const response = await fetch(`/api/measurement-devices/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(deviceData),
      });
      const updated = await response.json();
      setDevices(devices.map(d => d.id === id ? updated : d));
      setSelectedDevice(null);
    } catch (error) {
      console.error('Ошибка обновления:', error);
    }
  };

  const handleDeleteDevice = async (id) => {
    if (window.confirm('Удалить прибор?')) {
      try {
        await fetch(`/api/measurement-devices/${id}`, { method: 'DELETE' });
        setDevices(devices.filter(d => d.id !== id));
        setSelectedDevice(null);
      } catch (error) {
        console.error('Ошибка удаления:', error);
      }
    }
  };

  return (
    <div className="tab-layout">
      <aside className="tab-sidebar">
        <button 
          className="btn-add"
          onClick={() => setShowForm(!showForm)}
        >
          {showForm ? '✕ Отменить' : '+ Добавить прибор'}
        </button>
        <MeasurementDevicesList 
          devices={devices}
          selectedDevice={selectedDevice}
          onSelectDevice={setSelectedDevice}
        />
      </aside>

      <main className="tab-main">
        {showForm ? (
          <MeasurementDevicesForm 
            onSubmit={handleAddDevice}
            onCancel={() => setShowForm(false)}
          />
        ) : selectedDevice ? (
          <MeasurementDevicesCard 
            device={selectedDevice}
            onUpdate={(data) => handleUpdateDevice(selectedDevice.id, data)}
            onDelete={() => handleDeleteDevice(selectedDevice.id)}
          />
        ) : (
          <div className="empty-state">
            <p>Выберите прибор из списка или добавьте новый</p>
          </div>
        )}
      </main>
    </div>
  );
}

export default MeasurementDevicesTab;