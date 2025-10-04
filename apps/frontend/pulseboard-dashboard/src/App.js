import React, { useState } from 'react';
import { ApolloProvider } from '@apollo/client';
import client from './apolloClient';

import Login from './components/Login';
import SensorSelector from './components/SensorSelector';
import ChartView from './components/ChartView';

function App() {
  const [orgId, setOrgId] = useState(null);
  const [sensorType, setSensorType] = useState(null);

  if (!orgId) {
    return (
      <ApolloProvider client={client}>
        <Login onLogin={setOrgId} />
      </ApolloProvider>
    );
  }

  return (
    <ApolloProvider client={client}>
      <div className="App">
        <h2>PulseBoard Dashboard</h2>
        <SensorSelector orgId={orgId} onSensorChange={setSensorType} />
        {sensorType && <ChartView orgId={orgId} sensorType={sensorType} />}
      </div>
    </ApolloProvider>
  );
}

export default App;
