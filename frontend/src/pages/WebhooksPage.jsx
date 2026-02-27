import React, { useState, useEffect } from 'react';
import axios from 'axios';

const API_Base = 'http://localhost:8000/api/v1';

const AUTH_HEADERS = {
  'x-api-key': 'key_test_abc123',
  'x-api-secret': 'secret_test_xyz789'
};

const WebhooksPage = () => {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchLogs();
  }, []);

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${API_Base}/webhooks`, { headers: AUTH_HEADERS });
      setLogs(res.data.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleRetry = async (id) => {
    try {
      await axios.post(`${API_Base}/webhooks/${id}/retry`, {}, { headers: AUTH_HEADERS });
      alert('Retry Scheduled');
      fetchLogs();
    } catch (err) {
      alert('Retry Failed');
    }
  };

  return (
    <div data-test-id="webhook-config" style={{ padding: '20px' }}>
      <h2>Webhook Configuration</h2>
      
      <form data-test-id="webhook-config-form" onSubmit={(e) => e.preventDefault()}>
        <div style={{ marginBottom: '10px' }}>
          <label style={{ display: 'block' }}>Webhook URL</label>
          <input 
            data-test-id="webhook-url-input"
            type="url"
            placeholder="https://yoursite.com/webhook"
            defaultValue="http://host.docker.internal:4000/webhook"
            style={{ width: '300px', padding: '5px' }}
          />
        </div>
        
        <div style={{ marginBottom: '10px' }}>
          <label>Webhook Secret</label>
          <span style={{ marginLeft: '10px', fontWeight: 'bold' }} data-test-id="webhook-secret">whsec_test_abc123</span>
          <button data-test-id="regenerate-secret-button" style={{ marginLeft: '10px' }}>
            Regenerate
          </button>
        </div>
        
        <button data-test-id="save-webhook-button" type="submit">
          Save Configuration
        </button>
        
        <button data-test-id="test-webhook-button" type="button" style={{ marginLeft: '10px' }}>
          Send Test Webhook
        </button>
      </form>
      
      <hr style={{ margin: '20px 0' }} />

      <h3>Webhook Logs</h3>
      <button onClick={fetchLogs} style={{ marginBottom: '10px' }}>Refresh</button>
      
      <table data-test-id="webhook-logs-table" style={{ width: '100%', borderCollapse: 'collapse' }} border="1">
        <thead>
          <tr>
            <th>Event</th>
            <th>Status</th>
            <th>Attempts</th>
            <th>Last Attempt</th>
            <th>Response Code</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {logs.map(log => (
            <tr key={log.id} data-test-id="webhook-log-item" data-webhook-id={log.id}>
              <td data-test-id="webhook-event">{log.event}</td>
              <td data-test-id="webhook-status" style={{ color: log.status === 'success' ? 'green' : 'red' }}>{log.status}</td>
              <td data-test-id="webhook-attempts">{log.attempts}</td>
              <td data-test-id="webhook-last-attempt">
                {new Date(log.created_at).toLocaleString()}
              </td>
              <td data-test-id="webhook-response-code">{log.response_code || '-'}</td>
              <td>
                <button 
                  data-test-id="retry-webhook-button"
                  data-webhook-id={log.id}
                  onClick={() => handleRetry(log.id)}
                >
                  Retry
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default WebhooksPage;
