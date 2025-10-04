import React, { useState } from 'react';
import { ApolloProvider } from '@apollo/client';
import client from './apolloClient';

import Register from './components/Register';
import Login from './components/Login';
import SensorSelector from './components/SensorSelector';
import ChartView from './components/ChartView';

function App() {
  const [orgId, setOrgId] = useState(null);
  const [isRegistered, setIsRegistered] = useState(false);

  if (!orgId) {
    return (
      <ApolloProvider client={client}>
        {isRegistered ? (
          <Login onLogin={setOrgId} />
        ) : (
          <Register onRegistered={() => setIsRegistered(true)} />
        )}
      </ApolloProvider>
    );
  }

  return (
    <ApolloProvider client={client}>
      <div className="App">
        <h2>PulseBoard Dashboard</h2>
        <SensorSelector orgId={orgId} onSensorChange={setOrgId} />
        {orgId && <ChartView orgId={orgId} sensorType="voltage" />}
      </div>
    </ApolloProvider>
  );
}

export default App;
