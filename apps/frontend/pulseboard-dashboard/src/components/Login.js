import React, { useState } from 'react';

function Login({ onLogin }) {
  const [orgId, setOrgId] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    onLogin(orgId);
  };

  return (
    <form onSubmit={handleSubmit}>
      <input
        type="text"
        placeholder="Enter org_id"
        value={orgId}
        onChange={(e) => setOrgId(e.target.value)}
      />
      <button type="submit">Login</button>
    </form>
  );
}

export default Login;
